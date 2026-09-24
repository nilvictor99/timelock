<?php

use App\Models\Activity;
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
