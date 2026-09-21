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

it('exports csv by default with headers', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    Activity::create([
        'user_id' => $user->id,
        'title' => 'Tarea, con comilla "dobles"',
        'date' => now()->toDateString(),
        'start_at' => now(),
        'end_at' => now()->addHour(),
        'status' => 'COMPLETED',
        'points' => 5,
        'is_free' => false,
    ]);

    $response = $this->get('/api/export');

    expect($response->headers->get('content-type'))->toContain('text/csv')
        ->and($response->headers->get('content-disposition'))->toContain('timelock-export.csv')
        ->and($response->getContent())
        ->toContain('Actividad,Categoria,Inicio,Fin,Estado,Puntos')
        ->toContain('Tarea, con comilla ""dobles""');
});

it('exports json with curated settings', function () {
    $response = $this->getJson('/api/export?format=json')->assertOk();

    $data = $response->json();

    expect($data['user']['email'])->toBe($this->sessionEmail)
        ->and($data['user']['settings']['profileVisibility'])->toBe('PRIVATE')
        ->and($data['activities'])->toBeArray()
        ->and($data['user'])->not->toHaveKey('passwordHash');
});

it('respects date range filters', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    Activity::create([
        'user_id' => $user->id,
        'title' => 'Pasada',
        'date' => now()->subDays(30)->toDateString(),
        'start_at' => now()->subDays(30),
        'end_at' => now()->subDays(30)->addHour(),
        'status' => 'PLANNED',
        'points' => 1,
        'is_free' => false,
    ]);

    $data = $this->getJson('/api/export?format=json&from='.now()->subDays(5)->toDateString().'&to='.now()->addDays(1)->toDateString())
        ->assertOk()
        ->json();

    expect($data['activities'])->toHaveCount(0);
});

it('rejects an invalid date range', function () {
    $this->getJson('/api/export?from=not-a-date', ['Accept' => 'application/json'])
        ->assertStatus(400)
        ->assertJson(['error' => 'Rango de fechas no válido.']);
});

it('requires a session to export', function () {
    $this->withTimelockSession('token-inexistente')
        ->getJson('/api/export')
        ->assertStatus(401);
});
