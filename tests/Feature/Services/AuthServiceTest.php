<?php

use App\Models\Category;
use App\Models\Reward;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Services\AuthService;
use Carbon\CarbonImmutable;

it('registers a user with default categories, rewards and a session', function () {
    $service = app(AuthService::class);

    $result = $service->register(['email' => 'r@example.com', 'name' => 'R', 'password' => 'secreto123'], true);

    expect($result['user']->email)->toBe('r@example.com')
        ->and($result['token'])->not->toBeNull()
        ->and(Category::where('user_id', $result['user']->id)->count())->toBe(4)
        ->and(Reward::where('user_id', $result['user']->id)->count())->toBe(3)
        ->and(Category::where('user_id', $result['user']->id)->pluck('points_per_hour'))->contains(8)
        ->and($result['expiresAt']->gt(CarbonImmutable::now()->addDays(29)->startOfDay()))->toBeTrue()
        ->and($result['expiresAt']->lt(CarbonImmutable::now()->addDays(31)))->toBeTrue();
});

it('hashes passwords with bcrypt cost 12 and verifies them', function () {
    $service = app(AuthService::class);

    $hash = $service->hashPassword('clave-secreta');

    expect($hash)->toStartWith('$2y$12$')
        ->and($service->verifyPassword('clave-secreta', $hash))->toBeTrue()
        ->and($service->verifyPassword('incorrecta', $hash))->toBeFalse();
});

it('logs in only with valid credentials', function () {
    $service = app(AuthService::class);
    $service->register(['email' => 'l@example.com', 'name' => 'L', 'password' => 'buena123']);

    $session = $service->login('l@example.com', 'buena123', false);
    expect($session['token'])->not->toBeNull();

    expect($service->login('l@example.com', 'mala'))->toBeNull()
        ->and($service->login('no@example.com', 'buena123'))->toBeNull();
});

it('resolves the user from a session token and expires sessions', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 's@example.com', 'name' => 'S', 'password' => 'abc12345']);

    expect($service->getUserByToken($result['token'])?->email)->toBe('s@example.com')
        ->and($service->getUserByToken('token-invalid'))->toBeNull();

    $service->logout($result['token']);
    expect($service->getUserByToken($result['token']))->toBeNull();
});

it('deletes the session row when expired', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'e@example.com', 'name' => 'E', 'password' => 'abc12345']);

    $session = app(SessionRepositoryInterface::class)
        ->findByTokenHash($service->hashToken($result['token']));
    $session->update(['expires_at' => CarbonImmutable::now()->subMinute()]);

    expect($service->getUserByToken($result['token']))->toBeNull();

    $this->assertDatabaseMissing('sessions', ['id' => $session->id]);
});

it('invalidates all sessions of a user', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'i@example.com', 'name' => 'I', 'password' => 'abc12345']);

    $service->createSession($result['user']);

    expect($service->invalidateUserSessions($result['user']->id))->toBe(2)
        ->and($service->getUserByToken($result['token']))->toBeNull();
});

it('creates a single-use QR token and logs in with it', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'q@example.com', 'name' => 'Q', 'password' => 'abc12345']);

    $qr = $service->createQrToken($result['user']);

    expect($service->loginWithQr($qr['token'])?->email)->toBe('q@example.com')
        ->and($service->loginWithQr($qr['token']))->toBeNull();
});

it('rejects an expired QR token', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qe@example.com', 'name' => 'QE', 'password' => 'abc12345']);

    $qr = $service->createQrToken($result['user']);
    $probe = app(QrLoginTokenRepositoryInterface::class)
        ->findByHash($service->hashToken($qr['token']));
    $probe->update(['expires_at' => CarbonImmutable::now()->subMinute()]);

    expect($service->loginWithQr($qr['token']))->toBeNull();
});
