<?php

use App\Models\Activity;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('requires authentication', function () {
    $this->withUnencryptedCookie('timelock_session', 'invalido');

    $response = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24');

    $response->assertUnauthorized();
});

it('rejects an invalid date range', function () {
    $this->getJson('/api/stats/summary')->assertStatus(400);
    $this->getJson('/api/stats/summary?from=2026-09-24')->assertStatus(400);
    $this->getJson('/api/stats/summary?from=2026-09-24&to=2026-09-20')->assertStatus(400);
    $this->getJson('/api/stats/summary?from=not-a-date&to=2026-09-24')->assertStatus(400);
});

it('returns a zeroed summary in camelCase for a user without activities', function () {
    $data = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24')->assertOk()->json();

    expect($data)->toHaveKeys(['kpis', 'category', 'daily', 'topActivities', 'weekday', 'streak', 'rewardTrend', 'rewards'])
        ->and($data['kpis'])->toHaveKeys(['totalMinutes', 'completed', 'points', 'rewardsRedeemed', 'pointsSpent'])
        ->and($data['kpis']['totalMinutes'])->toBe(0)
        ->and($data['streak'])->toHaveKeys(['current', 'longest', 'perfectDays', 'history']);
});

it('aggregates activities within the requested range', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    Activity::create([
        'user_id' => $user->id,
        'title' => 'Dentro',
        'date' => '2026-09-21',
        'start_at' => new DateTimeImmutable('2026-09-21 10:00'),
        'end_at' => new DateTimeImmutable('2026-09-21 11:00'),
        'status' => 'COMPLETED',
        'points' => 10,
        'is_free' => false,
    ]);
    Activity::create([
        'user_id' => $user->id,
        'title' => 'Fuera',
        'date' => '2026-08-01',
        'start_at' => new DateTimeImmutable('2026-08-01 10:00'),
        'end_at' => new DateTimeImmutable('2026-08-01 11:00'),
        'status' => 'COMPLETED',
        'points' => 99,
        'is_free' => false,
    ]);

    $data = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24')->assertOk()->json();

    expect($data['kpis']['totalMinutes'])->toBe(60)
        ->and($data['kpis']['completed'])->toBe(1)
        ->and($data['kpis']['points'])->toBe(10);
});

function statsRangeActivity(User $user, string $title, string $day, string $time, int $points = 10, ?string $categoryId = null): Activity
{
    return Activity::create([
        'user_id' => $user->id,
        'category_id' => $categoryId,
        'title' => $title,
        'date' => $day,
        'start_at' => new DateTimeImmutable("{$day} {$time}", new DateTimeZone(config('app.timezone'))),
        'end_at' => (new DateTimeImmutable("{$day} {$time}", new DateTimeZone(config('app.timezone'))))->modify('+1 hour'),
        'status' => 'COMPLETED',
        'points' => $points,
        'is_free' => false,
    ]);
}

it('filters the summary by multiple activity ids', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $first = statsRangeActivity($user, 'Gym', '2026-09-21', '10:00');
    $second = statsRangeActivity($user, 'Leer', '2026-09-22', '11:00');
    statsRangeActivity($user, 'Trabajo', '2026-09-23', '09:00');

    $data = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24&activities='.$first->id.','.$second->id)
        ->assertOk()
        ->json();

    expect($data['kpis']['completed'])->toBe(2)
        ->and($data['daily'])->toHaveCount(2)
        ->and($data['topActivities'])->toHaveCount(2);
});

it('filters the summary by multiple category ids and excludes uncategorized activities', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $salud = Category::create(['user_id' => $user->id, 'name' => 'Salud', 'color' => '#22c55e']);
    $trabajo = Category::create(['user_id' => $user->id, 'name' => 'Trabajo', 'color' => '#3b82f6']);

    statsRangeActivity($user, 'Gym', '2026-09-21', '10:00', 10, $salud->id);
    statsRangeActivity($user, 'Correo', '2026-09-21', '12:00', 10, $trabajo->id);
    statsRangeActivity($user, 'Sin categoría', '2026-09-22', '15:00');

    $data = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24&categories='.$salud->id.','.$trabajo->id)
        ->assertOk()
        ->json();

    expect($data['kpis']['completed'])->toBe(2)
        ->and($data['category'])->toHaveCount(2)
        ->and(array_column($data['topActivities'], 'name'))->not->toContain('Sin categoría');
});

it('combines activity and category filters as an intersection', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $salud = Category::create(['user_id' => $user->id, 'name' => 'Salud', 'color' => '#22c55e']);
    $trabajo = Category::create(['user_id' => $user->id, 'name' => 'Trabajo', 'color' => '#3b82f6']);

    $gym = statsRangeActivity($user, 'Gym', '2026-09-21', '10:00', 10, $salud->id);
    $correo = statsRangeActivity($user, 'Correo', '2026-09-21', '12:00', 10, $trabajo->id);
    statsRangeActivity($user, 'Médico', '2026-09-22', '09:00', 10, $salud->id);

    $data = $this->getJson('/api/stats/summary?from=2026-09-20&to=2026-09-24&activities='.$gym->id.','.$correo->id.'&categories='.$salud->id)
        ->assertOk()
        ->json();

    expect($data['kpis']['completed'])->toBe(1)
        ->and($data['topActivities'][0]['name'])->toBe('Gym');
});

it('honors wall-clock day boundaries of the app timezone', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    statsRangeActivity($user, 'Tarde del día anterior', '2026-09-24', '23:30');
    statsRangeActivity($user, 'Tarde del último día', '2026-09-25', '23:30');

    $data = $this->getJson('/api/stats/summary?from=2026-09-25&to=2026-09-25')->assertOk()->json();

    expect($data['kpis']['totalMinutes'])->toBe(60)
        ->and($data['kpis']['completed'])->toBe(1)
        ->and($data['daily'])->toHaveCount(1)
        ->and($data['daily'][0]['date'])->toBe('2026-09-25');
});
