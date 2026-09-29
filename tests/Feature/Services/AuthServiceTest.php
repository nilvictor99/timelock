<?php

use App\Models\Category;
use App\Models\Reward;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Services\AuthService;
use Carbon\CarbonImmutable;
use InvalidArgumentException;

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

it('revokes previous QR tokens even when they were already used', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qv@example.com', 'name' => 'QV', 'password' => 'abc12345']);

    $first = $service->createQrToken($result['user']);
    $second = $service->createQrToken($result['user']);

    expect($service->loginWithQr($first['token']))->toBeNull()
        ->and($service->loginWithQr($second['token'])?->id)->toBe($result['user']->id);
});

it('defaults to ten minutes and a single use when no options are given', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qd@example.com', 'name' => 'QD', 'password' => 'abc12345']);

    $qr = $service->createQrToken($result['user']);

    expect($qr['ttlKey'])->toBe(config('qr.defaults.ttl'))
        ->and($qr['useKey'])->toBe(config('qr.defaults.uses'))
        ->and($qr['maxUses'])->toBe(1)
        ->and($qr['expiresAt'])->not->toBeNull()
        ->and($qr['expiresAt']->diffInMinutes(now()))->toBeLessThanOrEqual(10)
        ->and($qr['perpetual'])->toBeFalse();
});

it('honours the requested lifetime', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qw@example.com', 'name' => 'QW', 'password' => 'abc12345']);

    $week = $service->createQrToken($result['user'], '1w', '5');
    $never = $service->createQrToken($result['user'], 'never', '5');

    expect((int) round(now()->diffInMinutes($week['expiresAt'], true)))->toBe(config('qr.ttl_options.1w'))
        ->and($week['maxUses'])->toBe(5)
        ->and($never['expiresAt'])->toBeNull()
        ->and($never['maxUses'])->toBe(5)
        ->and($never['perpetual'])->toBeFalse();
});

it('logs in repeatedly until the use budget is spent', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qr3@example.com', 'name' => 'QR3', 'password' => 'abc12345']);

    $qr = $service->createQrToken($result['user'], '1d', '5');

    $logins = collect(range(1, 5))
        ->map(fn () => $service->loginWithQr($qr['token'])?->id)
        ->all();

    expect($logins)->toBe(array_fill(0, 5, $result['user']->id))
        ->and($service->loginWithQr($qr['token']))->toBeNull();
});

it('refuses an option key that is not in the whitelist', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qrx2@example.com', 'name' => 'QRX2', 'password' => 'abc12345']);

    expect(fn () => $service->createQrToken($result['user'], '1d', '3'))
        ->toThrow(InvalidArgumentException::class)
        ->and(fn () => $service->createQrToken($result['user'], '99y', '1'))
        ->toThrow(InvalidArgumentException::class);
});

it('accepts a perpetual token and flags it', function () {
    $service = app(AuthService::class);
    $result = $service->register(['email' => 'qrp2@example.com', 'name' => 'QRP2', 'password' => 'abc12345']);

    $qr = $service->createQrToken($result['user'], 'never', 'unlimited');

    expect($qr['perpetual'])->toBeTrue()
        ->and($qr['expiresAt'])->toBeNull()
        ->and($qr['maxUses'])->toBeNull()
        ->and($service->loginWithQr($qr['token'])?->id)->toBe($result['user']->id)
        ->and($service->loginWithQr($qr['token'])?->id)->toBe($result['user']->id);
});
