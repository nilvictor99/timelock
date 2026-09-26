<?php

use App\Models\Category;
use App\Models\User;
use App\Services\AuthService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a user against the real schema with a verifiable password', function () {
    $user = User::factory()->create();

    expect($user->password_hash)->not->toBeNull()
        ->and(password_verify('password', $user->password_hash))->toBeTrue()
        ->and($user->email)->not->toBeNull()
        ->and($user->operation_mode)->toBe('SYNCHRONOUS');
});

it('marks a user as onboarded through the onboarded state', function () {
    expect(User::factory()->onboarded()->create()->onboarding_completed)->toBeTrue();
});

it('creates the same default categories and rewards as a real registration', function () {
    $user = User::factory()->withDefaults()->create();

    $registered = app(AuthService::class)->register([
        'name' => 'Otro',
        'email' => 'otro@example.com',
        'password' => 'clave-super-segura-ok',
    ]);

    expect($user->categories()->pluck('name')->sort()->values()->all())
        ->toBe($registered['user']->categories()->pluck('name')->sort()->values()->all())
        ->and($user->rewards()->pluck('title')->sort()->values()->all())
        ->toBe($registered['user']->rewards()->pluck('title')->sort()->values()->all());
});

it('seeds activity history, points and streaks', function () {
    $user = User::factory()->onboarded()->withDefaults()->withHistory(days: 14)->create();

    expect($user->activities()->count())->toBe(14)
        ->and($user->activities()->where('status', 'COMPLETED')->count())->toBe(13)
        ->and($user->points)->toBeGreaterThan(0)
        ->and($user->current_streak)->toBe(13)
        ->and($user->best_streak)->toBe(13)
        ->and($user->activities()->whereNotNull('category_id')->count())->toBe(14);
});

it('seeds a loginable demo user', function () {
    $this->seed(DatabaseSeeder::class);

    $user = User::where('email', 'demo@timelock.dev')->first();

    expect($user)->not->toBeNull()
        ->and($user->onboarding_completed)->toBeTrue()
        ->and(password_verify('password', $user->password_hash))->toBeTrue()
        ->and($user->categories()->count())->toBe(4)
        ->and($user->rewards()->count())->toBe(3)
        ->and($user->activities()->count())->toBe(14);
});

it('is idempotent when seeded twice', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::where('email', 'demo@timelock.dev')->count())->toBe(1)
        ->and(User::count())->toBe(1)
        ->and(Category::count())->toBe(4);
});
