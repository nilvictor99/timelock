<?php

use App\Models\Activity;
use App\Models\Category;
use App\Models\Reward;
use App\Models\User;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function statsUser(): User
{
    return User::create([
        'email' => 'stats-'.bin2hex(random_bytes(4)).'@example.com',
        'name' => 'Stats User',
        'password_hash' => password_hash('clave-super-segura-ok', PASSWORD_DEFAULT),
        'current_streak' => 2,
        'best_streak' => 4,
    ]);
}

function statsActivity(User $user, string $start, int $minutes, string $status = 'COMPLETED', ?Category $category = null, int $points = 10): Activity
{
    return Activity::create([
        'user_id' => $user->id,
        'category_id' => $category?->id,
        'title' => 'Actividad '.$start,
        'date' => substr($start, 0, 10),
        'start_at' => new DateTimeImmutable($start),
        'end_at' => (new DateTimeImmutable($start))->modify("+{$minutes} minutes"),
        'status' => $status,
        'points' => $points,
        'is_free' => false,
    ]);
}

function summaryFor(User $user, string $from, string $to, ?array $activities = null, ?array $categories = null): array
{
    return app(StatsService::class)->summary(
        $user->id,
        $user,
        new DateTimeImmutable($from.'T00:00:00.000Z'),
        new DateTimeImmutable($to.'T23:59:59.999Z'),
        $activities,
        $categories,
    );
}

it('computes kpis for a range', function () {
    $user = statsUser();
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED', points: 10);
    statsActivity($user, '2026-09-21 12:00', 30, 'PLANNED', points: 5);
    statsActivity($user, '2026-09-23 10:00', 90, 'COMPLETED', points: 7);

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['kpis'])->toBe([
        'totalMinutes' => 180,
        'completed' => 2,
        'points' => 17,
        'rewardsRedeemed' => 0,
        'pointsSpent' => 0,
    ]);
});

it('aggregates by category sorted by minutes and skips zero-length', function () {
    $user = statsUser();
    $work = Category::create(['user_id' => $user->id, 'name' => 'Trabajo', 'color' => '#123456']);
    statsActivity($user, '2026-09-21 10:00', 30, 'COMPLETED', $work);
    statsActivity($user, '2026-09-21 12:00', 90, 'COMPLETED', $work);
    statsActivity($user, '2026-09-22 10:00', 45, 'COMPLETED');

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['category'])->toHaveLength(2)
        ->and($summary['category'][0]['name'])->toBe('Trabajo')
        ->and($summary['category'][0]['minutes'])->toBe(120)
        ->and($summary['category'][0]['color'])->toBe('#123456')
        ->and($summary['category'][1]['minutes'])->toBe(45)
        ->and($summary['category'][1]['color'])->toBeNull();
});

it('builds daily buckets and top activities', function () {
    $user = statsUser();
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED');
    statsActivity($user, '2026-09-21 12:00', 30, 'PLANNED');
    statsActivity($user, '2026-09-23 10:00', 90, 'COMPLETED');

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['daily'])->toHaveLength(2)
        ->and($summary['daily'][0])->toBe(['date' => '2026-09-21', 'minutes' => 90, 'completed' => 1, 'total' => 2])
        ->and($summary['daily'][1]['date'])->toBe('2026-09-23')
        ->and($summary['topActivities'])->toHaveLength(3);
});

it('computes weekday compliance', function () {
    $user = statsUser();
    // 2026-09-21 = lunes
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED');
    statsActivity($user, '2026-09-21 12:00', 30, 'PLANNED');
    statsActivity($user, '2026-09-22 10:00', 45, 'COMPLETED');

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    $monday = $summary['weekday'][1];
    $tuesday = $summary['weekday'][2];
    expect($summary['weekday'])->toHaveLength(7)
        ->and($monday)->toBe(['day' => 1, 'completed' => 1, 'total' => 2, 'compliance' => 50])
        ->and($tuesday['compliance'])->toBe(100)
        ->and($summary['weekday'][0]['compliance'])->toBe(0);
});

it('computes streaks, perfect days and history within range', function () {
    $user = statsUser();
    // racha de 3 días consecutivos (21, 22, 23 sep)
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED');
    statsActivity($user, '2026-09-22 10:00', 60, 'COMPLETED');
    statsActivity($user, '2026-09-23 10:00', 60, 'COMPLETED');
    // día con total>0 pero incompleto (no perfecto, rompe racha de completadas)
    statsActivity($user, '2026-09-24 10:00', 60, 'PLANNED');

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['streak']['longest'])->toBe(4)
        ->and($summary['streak']['longest'])->toBeGreaterThanOrEqual($user->best_streak)
        ->and($summary['streak']['perfectDays'])->toBe(3)
        ->and($summary['streak']['current'])->toBe(2)
        ->and($summary['streak']['history'])->toHaveLength(5)
        ->and($summary['streak']['history'][0]['date'])->toBe('2026-09-20')
        ->and($summary['streak']['history'][4]['completed'])->toBeFalse()
        ->and($summary['streak']['history'][4]['total'])->toBe(1);
});

it('caps streak history at 370 days', function () {
    $user = statsUser();
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED');

    $summary = summaryFor($user, '2024-01-01', '2026-09-24');

    expect($summary['streak']['history'])->toHaveLength(370);
});

it('includes redeemed rewards in range, kpis and trend', function () {
    $user = statsUser();
    statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED');

    Reward::create(['user_id' => $user->id, 'title' => 'Cine', 'cost' => 50, 'redeemed_at' => new DateTimeImmutable('2026-09-22 15:00')]);
    Reward::create(['user_id' => $user->id, 'title' => 'Fuera de rango', 'cost' => 999, 'redeemed_at' => new DateTimeImmutable('2025-01-01 15:00')]);

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['kpis']['rewardsRedeemed'])->toBe(1)
        ->and($summary['kpis']['pointsSpent'])->toBe(50)
        ->and($summary['rewards'])->toHaveLength(1)
        ->and($summary['rewards'][0]['title'])->toBe('Cine')
        ->and($summary['rewardTrend'])->toHaveLength(1);
});

it('groups reward trend by month for wide ranges', function () {
    $user = statsUser();
    Reward::create(['user_id' => $user->id, 'title' => 'A', 'cost' => 10, 'redeemed_at' => new DateTimeImmutable('2026-01-15 15:00')]);
    Reward::create(['user_id' => $user->id, 'title' => 'B', 'cost' => 10, 'redeemed_at' => new DateTimeImmutable('2026-01-20 15:00')]);
    Reward::create(['user_id' => $user->id, 'title' => 'C', 'cost' => 10, 'redeemed_at' => new DateTimeImmutable('2026-02-10 15:00')]);

    $summary = summaryFor($user, '2025-12-01', '2026-03-01');

    expect($summary['rewardTrend'])->toBe([
        ['date' => '2026-01-01', 'count' => 2],
        ['date' => '2026-02-01', 'count' => 1],
    ]);
});

it('filters by activity ids and category ids', function () {
    $user = statsUser();
    $work = Category::create(['user_id' => $user->id, 'name' => 'Trabajo', 'color' => '#123456']);
    $keep = statsActivity($user, '2026-09-21 10:00', 60, 'COMPLETED', $work);
    statsActivity($user, '2026-09-21 12:00', 30, 'COMPLETED', $work);

    $byActivity = summaryFor($user, '2026-09-20', '2026-09-24', [$keep->id]);
    expect($byActivity['kpis']['totalMinutes'])->toBe(60)
        ->and($byActivity['kpis']['completed'])->toBe(1);

    $byCategory = summaryFor($user, '2026-09-20', '2026-09-24', null, [$work->id]);
    expect($byCategory['kpis']['totalMinutes'])->toBe(90);

    $emptyFilter = summaryFor($user, '2026-09-20', '2026-09-24', ['id-inexistente']);
    expect($emptyFilter['kpis']['totalMinutes'])->toBe(0);
});

it('returns zeroed summary for an empty range', function () {
    $user = statsUser();

    $summary = summaryFor($user, '2026-09-20', '2026-09-24');

    expect($summary['kpis']['totalMinutes'])->toBe(0)
        ->and($summary['kpis']['completed'])->toBe(0)
        ->and($summary['kpis']['points'])->toBe(0)
        ->and($summary['kpis']['rewardsRedeemed'])->toBe(0)
        ->and($summary['category'])->toBe([])
        ->and($summary['daily'])->toBe([])
        ->and($summary['topActivities'])->toBe([])
        ->and($summary['streak']['history'])->toHaveLength(5)
        ->and($summary['rewardTrend'])->toBe([]);
});
