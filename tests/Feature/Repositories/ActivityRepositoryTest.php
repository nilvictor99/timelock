<?php

use App\Models\Category;
use App\Models\User;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Str;

function makeUser(string $email): User
{
    return app(UserRepositoryInterface::class)
        ->createWithDefaults(['email' => $email, 'name' => 'U']);
}

it('creates and lists activities scoped by user', function () {
    $user = makeUser('act@example.com');
    $other = makeUser('other@example.com');
    $repo = app(ActivityRepositoryInterface::class);

    $activity = $repo->create([
        'user_id' => $user->id,
        'title' => 'Correr',
        'date' => now(),
        'start_at' => now()->setTime(8, 0),
        'end_at' => now()->setTime(9, 0),
    ]);

    expect($activity->exists)->toBeTrue();
    expect($repo->findByUser($user->id))->toHaveCount(1)
        ->and($repo->findByUser($other->id))->toHaveCount(0)
        ->and($repo->findByIdAndUser($activity->id, $user->id))->not->toBeNull()
        ->and($repo->findByIdAndUser($activity->id, $other->id))->toBeNull();
});

it('updates and deletes activities scoped by user', function () {
    $user = makeUser('act2@example.com');
    $repo = app(ActivityRepositoryInterface::class);
    $activity = $repo->create(['user_id' => $user->id, 'title' => 'A', 'date' => now(), 'start_at' => now(), 'end_at' => now()->addHour()]);

    expect($repo->update($activity->id, $user->id, ['title' => 'B']))->toBeTrue()
        ->and($activity->refresh()->title)->toBe('B');

    expect($repo->updateTimes($activity->id, $user->id, now()->addDay(), now()->addDay()->setTime(10, 0), now()->addDay()->setTime(11, 0)))->toBeTrue();

    expect($repo->deleteByIdAndUser($activity->id, $user->id))->toBeTrue()
        ->and($repo->findByIdAndUser($activity->id, $user->id))->toBeNull();
});

it('filters planned activities after a date', function () {
    $user = makeUser('planned@example.com');
    $repo = app(ActivityRepositoryInterface::class);
    $tomorrow = now()->addDay();

    $repo->create(['user_id' => $user->id, 'title' => 'Futuro', 'date' => $tomorrow, 'start_at' => $tomorrow->setTime(9, 0), 'end_at' => $tomorrow->setTime(10, 0), 'status' => 'PLANNED']);
    $repo->create(['user_id' => $user->id, 'title' => 'Pendiente-hoy', 'date' => now(), 'start_at' => now()->setTime(9, 0), 'end_at' => now()->setTime(10, 0), 'status' => 'PLANNED']);

    expect($repo->findByPlannedAfter($user->id, now()))->toHaveCount(1);
});

it('lists categories scoped by user', function () {
    $user = makeUser('cat@example.com');
    $repo = app(CategoryRepositoryInterface::class);

    Category::create(['user_id' => $user->id, 'name' => 'Deporte', 'color' => '#ff0000']);

    expect($repo->findByUser($user->id))->toHaveCount(1)
        ->and($repo->findByIdAndUser((string) Str::uuid(), $user->id))->toBeNull();
});
