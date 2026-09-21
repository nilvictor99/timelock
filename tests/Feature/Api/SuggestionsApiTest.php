<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('returns recent suggestions as empty by default', function () {
    $this->getJson('/api/suggestions')
        ->assertOk()
        ->assertJson(['suggestions' => [], 'source' => 'rule']);
});

it('generates rule-based suggestions without a provider and persists them', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $response = $this->postJson('/api/suggestions', ['action' => 'generate']);

    $response->assertOk();

    $data = $response->json();

    expect(count($data['suggestions']))->toBeBetween(3, 5)
        ->and($data['source'])->toBe('rule')
        ->and($data['provider'])->toBeNull()
        ->and($data['action'])->toBe('generate')
        ->and($data['warning'])->not->toBeNull();

    $this->assertDatabaseCount('suggestions', count($data['suggestions']));
    $this->assertDatabaseHas('suggestions', ['user_id' => $user->id, 'source' => 'rule']);
});

it('generates AI suggestions and stores them with source ai', function () {
    putenv('OPENAI_API_KEY=sk-test');
    putenv('AI_PROVIDER=');
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $user->update(['ai_provider' => 'OPENAI', 'ai_model' => 'gpt-4o-mini']);

    $payload = [
        'suggestions' => [
            ['title' => 'Yoga suave', 'category' => 'Física', 'duration' => 30, 'reason' => 'Relaja el cuerpo', 'points' => 20, 'time' => '07:30'],
            ['title' => 'Leer 20 páginas', 'category' => 'Mental', 'duration' => 45, 'reason' => 'Cultura', 'points' => 25, 'time' => null],
            ['title' => 'Cocinar algo nuevo', 'category' => 'Creativa', 'duration' => 60, 'reason' => 'Crear', 'points' => 30, 'time' => '20:00'],
        ],
    ];

    Http::fake([
        '*/chat/completions' => Http::response([
            'choices' => [['message' => ['content' => json_encode($payload)]]],
        ], 200),
    ]);

    $response = $this->postJson('/api/suggestions', ['action' => 'generate']);

    $response->assertOk();

    $data = $response->json();

    expect($data['source'])->toBe('ai')
        ->and($data['provider'])->toBe('OPENAI')
        ->and(array_key_exists('warning', $data))->toBeFalse()
        ->and($data['suggestions'][0]['title'])->toBe('Yoga suave');

    $this->assertDatabaseHas('suggestions', ['user_id' => $user->id, 'source' => 'ai']);
});

it('rejects an unknown action', function () {
    $this->postJson('/api/suggestions', ['action' => 'boom'])
        ->assertStatus(400)
        ->assertJson(['error' => 'Solicitud de sugerencias no válida.']);
});

it('rate limits regenerations after 5 in 10 minutes', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/suggestions', ['action' => 'regenerate'])->assertOk();
    }

    $response = $this->postJson('/api/suggestions', ['action' => 'regenerate']);

    expect($response->status())->toBe(429)
        ->and($response->json('retryAfter'))->toBeInt()
        ->and($response->headers->get('Retry-After'))->not->toBeNull()
        ->and($response->json('error'))->toContain('límite temporal');

    Cache::store('file')->forget('suggestion-rate:'.User::where('email', $this->sessionEmail)->firstOrFail()->id);
});
