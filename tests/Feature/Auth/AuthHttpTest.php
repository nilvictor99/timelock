<?php

use App\Services\AuthService;

it('registers a user, sets the session cookie and creates defaults', function () {
    $response = $this->post('/register', [
        'name' => 'Nuevo',
        'email' => 'new@example.com',
        'password' => 'clave-super-segura',
        'acceptTerms' => true,
    ]);

    $response->assertRedirect(route('onboarding'))
        ->assertCookie(AuthService::SESSION_COOKIE)
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('users', ['email' => 'new@example.com'])
        ->assertDatabaseCount('categories', 4)
        ->assertDatabaseCount('rewards', 3);
});

it('rejects a duplicate email on register', function () {
    app(AuthService::class)->register([
        'name' => 'Senior',
        'email' => 'dup@example.com',
        'password' => 'clave-super-segura',
        'acceptTerms' => true,
    ]);

    $response = $this->post('/register', [
        'name' => 'Beto',
        'email' => 'dup@example.com',
        'password' => 'clave-super-segura',
        'acceptTerms' => true,
    ]);

    $response->assertSessionHasErrors('email')
        ->assertSessionHasErrors(['email' => 'Ya existe una cuenta con ese correo.']);
});

it('rejects weak or compromised passwords', function () {
    foreach (['corta', 'passwordpassword'] as $password) {
        $this->post('/register', [
            'name' => 'X',
            'email' => "weak-$password@example.com",
            'password' => $password,
            'acceptTerms' => true,
        ])->assertSessionHasErrors('password');
    }

    $this->post('/register', [
        'name' => 'Y',
        'email' => 'noterms@example.com',
        'password' => 'clave-super-segura',
    ])->assertSessionHasErrors('acceptTerms');
});

it('logs in with valid credentials and redirects to dashboard when onboarding done', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'login@example.com', 'name' => 'L', 'password' => 'clave-super-segura']);
    $result['user']->update(['onboarding_completed' => true]);

    $response = $this->post('/login', [
        'email' => 'login@example.com',
        'password' => 'clave-super-segura',
        'remember' => true,
    ]);

    $response->assertRedirect(route('dashboard'))
        ->assertCookie(AuthService::SESSION_COOKIE);

    $this->assertDatabaseCount('sessions', 2);
});

it('rejects invalid login credentials', function () {
    $this->post('/login', [
        'email' => 'nobody@example.com',
        'password' => 'clave-super-segura',
    ])->assertSessionHasErrors('auth');
});

it('protects dashboard with the session cookie', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'protect@example.com', 'name' => 'P', 'password' => 'clave-super-segura']);
    $result['user']->update(['onboarding_completed' => true]);

    $this->get('/dashboard')->assertRedirect();

    $response = $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])->get('/dashboard');
    $response->assertOk()->assertInertia(fn ($page) => $page->component('Dashboard/Index'));
});

it('logs out, clears the cookie and deletes the session row', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'out@example.com', 'name' => 'O', 'password' => 'clave-super-segura']);

    $response = $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->post('/logout');

    $response->assertRedirect(route('home'))
        ->assertCookieExpired(AuthService::SESSION_COOKIE);

    $this->assertDatabaseCount('sessions', 0);
});

it('creates a QR token for an authenticated user and logs in once via QR', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'qr@example.com', 'name' => 'Q', 'password' => 'clave-super-segura']);

    $qr = $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->withCredentials()
        ->postJson('/auth/qr')
        ->assertOk()
        ->json('token');

    $response = $this->postJson('/auth/qr-login', ['token' => $qr]);
    $response->assertOk()->assertJsonPath('ok', true);

    $cookie = $response->getCookie(AuthService::SESSION_COOKIE, false);
    expect($cookie)->not->toBeNull();

    $this->postJson('/auth/qr-login', ['token' => $qr])->assertStatus(401);
});

it('returns the current user from /auth/me', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'me@example.com', 'name' => 'M', 'password' => 'clave-super-segura']);

    $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->withCredentials()
        ->getJson('/auth/me')
        ->assertOk()
        ->assertJsonPath('user.email', 'me@example.com');
});

it('does not cache the QR token response', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'qrs@example.com', 'name' => 'QS', 'password' => 'clave-super-segura']);

    $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->withCredentials()
        ->postJson('/auth/qr')
        ->assertOk()
        ->assertHeaderContains('Cache-Control', 'no-store');
});

it('redirects to onboarding after QR login when onboarding is pending', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'qron@example.com', 'name' => 'QON', 'password' => 'clave-super-segura']);

    $qr = $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->withCredentials()
        ->postJson('/auth/qr')
        ->assertOk()
        ->json('token');

    $this->postJson('/auth/qr-login', ['token' => $qr])
        ->assertOk()
        ->assertJsonPath('redirect', route('onboarding'));
});

it('redirects to dashboard after QR login when onboarding is complete', function () {
    $auth = app(AuthService::class);
    $result = $auth->register(['email' => 'qrdash@example.com', 'name' => 'QD', 'password' => 'clave-super-segura']);
    $result['user']->update(['onboarding_completed' => true]);

    $qr = $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $result['token'])
        ->withCredentials()
        ->postJson('/auth/qr')
        ->assertOk()
        ->json('token');

    $this->postJson('/auth/qr-login', ['token' => $qr])
        ->assertOk()
        ->assertJsonPath('redirect', route('dashboard'));
});

it('throttles qr-login attempts to 10 per minute', function () {
    foreach (range(1, 10) as $i) {
        $this->postJson('/auth/qr-login', ['token' => 'x'])->assertStatus(401);
    }

    $this->postJson('/auth/qr-login', ['token' => 'x'])->assertStatus(429);
});
