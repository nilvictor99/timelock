<?php

use App\Models\Activity;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('requires a session to fetch bootstrap', function () {
    $this->withTimelockSession('token-inexistente')
        ->getJson('/api/bootstrap')
        ->assertStatus(401);
});

it('returns user, lists and today on bootstrap', function () {
    $response = $this->getJson('/api/bootstrap')->assertOk();

    $data = $response->json();

    expect($data['user']['email'])->toBeString()
        ->and($data['today'])->toMatch('/^\d{4}-\d{2}-\d{2}$/')
        ->and($data['categories'])->toHaveCount(4)
        ->and($data['rewards'])->toHaveCount(3)
        ->and($data['categories'][0]['pointsPerHour'])->toBeInt()
        ->and($data['actions'] ?? 'absent')->toBe('absent');

    expect($data['user'])->not->toHaveKey('password_hash');
});

it('creates an activity with computed points', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $category = $user->categories()->firstOrFail();

    $response = $this->postJson('/api/bootstrap', [
        'action' => 'activity',
        'title' => 'Estudiar Laravel',
        'categoryId' => $category->id,
        'startAt' => now()->startOfDay()->addHours(9)->toIso8601String(),
        'endAt' => now()->startOfDay()->addHours(10)->toIso8601String(),
    ]);

    $response->assertCreated();

    expect($response->json('title'))->toBe('Estudiar Laravel')
        ->and($response->json('points'))->toBe($category->points_per_hour)
        ->and($response->json('category.name'))->toBe($category->name)
        ->and($response->json('isFree'))->toBeFalse();

    $this->assertDatabaseHas('activities', ['user_id' => $user->id, 'title' => 'Estudiar Laravel']);
});

it('rejects an activity without a valid title or range', function () {
    $this->postJson('/api/bootstrap', ['action' => 'activity', 'title' => ' '])
        ->assertStatus(400)
        ->assertJson(['error' => 'Título y horario válido son obligatorios.']);
});

it('creates a reward', function () {
    $response = $this->postJson('/api/bootstrap', [
        'action' => 'reward',
        'title' => 'Cine',
        'cost' => 250,
    ]);

    $response->assertCreated()->assertJson(['title' => 'Cine', 'cost' => 250]);

    $response = $this->postJson('/api/bootstrap', ['action' => 'reward', 'title' => 'X', 'cost' => 0]);
    $response->assertStatus(400)->assertJson(['error' => 'Título y costo válido son obligatorios.']);
});

it('updates profile settings and completes onboarding', function () {
    $response = $this->postJson('/api/bootstrap', [
        'action' => 'onboarding',
        'name' => 'Ana',
        'timezone' => 'Europe/Madrid',
        'language' => 'es',
        'operationMode' => 'FREE',
    ])->assertOk();

    expect($response->json('name'))->toBe('Ana')
        ->and($response->json('timezone'))->toBe('Europe/Madrid')
        ->and($response->json('operationMode'))->toBe('FREE')
        ->and($response->json('onboardingCompleted'))->toBeTrue();
});

it('activates and expires a pause', function () {
    $this->postJson('/api/bootstrap', [
        'action' => 'pause',
        'active' => true,
        'endsAt' => now()->subMinute(1)->toIso8601String(),
    ])->assertOk();

    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    expect($user->pause_active)->toBeFalse();
});

it('completes an activity and awards points once', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $category = $user->categories()->firstOrFail();

    $activity = Activity::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'title' => 'Correr',
        'date' => now()->toDateString(),
        'start_at' => now()->subHour(),
        'end_at' => now(),
        'status' => 'PLANNED',
        'points' => 8,
        'is_free' => false,
    ]);

    $user->update(['points' => 0]);

    $this->patchJson('/api/bootstrap', ['id' => $activity->id, 'status' => 'COMPLETED'])
        ->assertOk()
        ->assertJsonPath('status', 'COMPLETED');

    expect($user->refresh()->points)->toBe(8);

    $this->patchJson('/api/bootstrap', ['id' => $activity->id, 'status' => 'COMPLETED'])
        ->assertOk();

    expect($user->refresh()->points)->toBe(8);
});

it('deletes an activity by id', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $activity = Activity::create([
        'user_id' => $user->id,
        'title' => 'Demo',
        'date' => now()->toDateString(),
        'start_at' => now(),
        'end_at' => now()->addHour(),
        'status' => 'PLANNED',
        'points' => 0,
        'is_free' => false,
    ]);

    $this->deleteJson('/api/bootstrap?id='.$activity->id)->assertOk()->assertJson(['ok' => true]);
    $this->assertDatabaseMissing('activities', ['id' => $activity->id]);

    $this->deleteJson('/api/bootstrap?id='.$activity->id)->assertStatus(404);
});

it('deletes the account with confirmation', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $response = $this->deleteJson('/api/bootstrap', [
        'email' => $user->email,
        'confirmation' => 'DELETE_ACCOUNT',
    ]);

    $response->assertOk()->assertJson(['ok' => true]);

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
    $this->assertDatabaseMissing('sessions', ['token_hash' => app(AuthService::class)->hashToken($this->token)]);
});

it('rejects account deletion without confirmation', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $this->deleteJson('/api/bootstrap', ['email' => $user->email, 'confirmation' => 'NO'])
        ->assertStatus(400)
        ->assertJson(['error' => 'La confirmación de eliminación no es válida.']);
});
