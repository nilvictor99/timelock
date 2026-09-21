<?php

use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Str;

it('creates a user with defaults and finds by id/email', function () {
    $repo = app(UserRepositoryInterface::class);

    $user = $repo->createWithDefaults([
        'name' => 'Test',
        'email' => 'test@example.com',
        'password_hash' => bcrypt('secret'),
    ]);

    expect($user->exists)->toBeTrue()
        ->and($user->id)->not->toBeNull()
        ->and($user->timezone)->toBe('UTC')
        ->and($user->language)->toBe('es');

    expect($repo->find($user->id)?->id)->toBe($user->id)
        ->and($repo->findByEmail('test@example.com')?->id)->toBe($user->id);
});

it('updates and deletes a user', function () {
    $repo = app(UserRepositoryInterface::class);
    $user = $repo->createWithDefaults(['name' => 'A', 'email' => 'a@example.com']);

    expect($repo->update($user->id, ['name' => 'B']))->toBeTrue()
        ->and($user->refresh()->name)->toBe('B');

    expect($repo->delete($user->id))->toBeTrue()
        ->and($repo->find($user->id))->toBeNull();
});

it('increments user points and touches last access', function () {
    $repo = app(UserRepositoryInterface::class);
    $user = $repo->createWithDefaults(['email' => 'p@example.com']);

    expect($repo->incrementPoints($user->id, 25))->toBeTrue()
        ->and($user->refresh()->points)->toBe(25);

    expect($repo->touchLastAccess($user->id))->toBeTrue()
        ->and($user->fresh()->last_access_at)->not->toBeNull();
});

it('does not find a non-existing user', function () {
    $repo = app(UserRepositoryInterface::class);

    expect($repo->find((string) Str::uuid()))->toBeNull()
        ->and($repo->findByEmail('nobody@example.com'))->toBeNull();
});
