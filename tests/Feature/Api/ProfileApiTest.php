<?php

use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('uploads a valid avatar image', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $file = $this->makeUpload(base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=='), 'avatar.jpg');

    $response = $this->post('/api/profile/avatar', ['file' => $file]);

    $response->assertOk();

    expect($response->json('avatarUrl'))->toStartWith('/uploads/')
        ->and($user->fresh()->avatar_url)->toEqual($response->json('avatarUrl'));

    $this->cleanupUpload($response->json('avatarUrl'));
});

it('rejects non-image files', function () {
    $file = $this->makeUpload('esto no es una imagen', 'avatar.jpg');

    $this->post('/api/profile/avatar', ['file' => $file])
        ->assertStatus(400)
        ->assertJson(['error' => 'El archivo no parece ser una imagen válida.']);
});

it('rejects unsupported mime types', function () {
    $file = $this->makeUpload("\x47\x49\x46\x38\x39\x61".random_bytes(32), 'avatar.gif');

    $this->post('/api/profile/avatar', ['file' => $file])
        ->assertStatus(400)
        ->assertJson(['error' => 'La imagen debe ser JPG, PNG o WebP y pesar hasta 5 MB.']);
});

it('changes the email with the current password', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $response = $this->postJson('/api/profile/email', [
        'email' => 'nuevo@example.com',
        'currentPassword' => 'clave-super-segura-ok',
    ]);

    $response->assertOk()->assertJson(['ok' => true]);

    expect($user->fresh()->email)->toBe('nuevo@example.com');

    $this->assertDatabaseHas('sessions', ['user_id' => $user->id]);
    expect($response->getCookie(AuthService::SESSION_COOKIE, false))->not->toBeNull();
});

it('rejects an email change with the wrong password', function () {
    $this->postJson('/api/profile/email', [
        'email' => 'x@example.com',
        'currentPassword' => 'incorrecta',
    ])
        ->assertStatus(401)
        ->assertJson(['error' => 'La contraseña actual no es válida.']);
});

it('rejects an email change to the same email', function () {
    $this->postJson('/api/profile/email', [
        'email' => $this->sessionEmail,
        'currentPassword' => 'clave-super-segura-ok',
    ])
        ->assertStatus(400)
        ->assertJson(['error' => 'El correo nuevo debe ser diferente.']);
});

it('rejects an email already in use', function () {
    app(AuthService::class)->register([
        'name' => 'Otra',
        'email' => 'otro@example.com',
        'password' => 'clave-super-segura-ok',
        'acceptTerms' => true,
    ]);

    $this->postJson('/api/profile/email', [
        'email' => 'otro@example.com',
        'currentPassword' => 'clave-super-segura-ok',
    ])
        ->assertStatus(409)
        ->assertJson(['error' => 'Ese correo ya está en uso.']);
});

it('changes the password and invalidates other sessions', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $response = $this->postJson('/api/profile/password', [
        'currentPassword' => 'clave-super-segura-ok',
        'newPassword' => 'nueva-clave-super-segura',
        'confirmPassword' => 'nueva-clave-super-segura',
    ]);

    $response->assertOk()->assertJson(['ok' => true]);

    expect(app(AuthService::class)->verifyPassword('nueva-clave-super-segura', $user->fresh()->password_hash))->toBeTrue();

    $this->assertDatabaseCount('sessions', 1);
});

it('rejects a password change with the wrong current password', function () {
    $this->postJson('/api/profile/password', [
        'currentPassword' => 'incorrecta',
        'newPassword' => 'nueva-clave-super-segura',
        'confirmPassword' => 'nueva-clave-super-segura',
    ])
        ->assertStatus(401)
        ->assertJson(['error' => 'La contraseña actual no es válida.']);
});

it('rejects a password change when new equals current', function () {
    $this->postJson('/api/profile/password', [
        'currentPassword' => 'clave-super-segura-ok',
        'newPassword' => 'clave-super-segura-ok',
        'confirmPassword' => 'clave-super-segura-ok',
    ])
        ->assertStatus(400)
        ->assertJson(['error' => 'La nueva contraseña debe ser diferente.']);
});

it('rejects a too short new password', function () {
    $this->postJson('/api/profile/password', [
        'currentPassword' => 'clave-super-segura-ok',
        'newPassword' => 'corta',
        'confirmPassword' => 'corta',
    ])
        ->assertStatus(400)
        ->assertJson(['error' => 'La contraseña nueva debe tener al menos 12 caracteres.']);
});
