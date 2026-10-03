<?php

use App\Services\AiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('rejects an invalid provider', function () {
    putenv('OPENAI_API_KEY=sk-test');

    $this->postJson('/api/ai/test-connection', [
        'provider' => 'MALO',
        'model' => 'x',
        'apiKey' => 'abc',
    ])
        ->assertStatus(400)
        ->assertJson(['error' => 'Proveedor, modelo y API key son obligatorios.']);
});

it('tests a connection successfully', function () {
    putenv('OPENAI_API_KEY=sk-test');

    $this->app->instance(AiService::class, new AiService(
        fn (string $host) => $host === 'api.openai.com' ? ['1.1.1.1'] : [],
    ));

    Http::fake(['*/chat/completions' => Http::response(['choices' => []], 200)]);

    $this->postJson('/api/ai/test-connection', [
        'provider' => 'OPENAI',
        'model' => 'gpt-4o-mini',
        'baseUrl' => 'https://api.openai.com/v1',
        'apiKey' => 'sk-test',
    ])
        ->assertOk()
        ->assertJson(['ok' => true]);
});

it('returns 502 when the provider responds with an error', function () {
    Http::fake(['*/chat/completions' => Http::response(['error' => 'boom'], 500)]);

    $this->postJson('/api/ai/test-connection', [
        'provider' => 'OPENROUTER',
        'model' => 'openai/gpt-4o-mini',
        'apiKey' => 'sk-test',
    ])
        ->assertStatus(502)
        ->assertJson(['error' => 'El proveedor respondió con HTTP 500.']);
});

it('returns 502 on a connection failure', function () {
    Http::fake([
        '*/chat/completions' => function () {
            throw new ConnectionException('timeout');
        },
    ]);

    $this->postJson('/api/ai/test-connection', [
        'provider' => 'OPENAI',
        'model' => 'gpt-4o-mini',
        'apiKey' => 'sk-test',
    ])
        ->assertStatus(502)
        ->assertJson(['error' => 'No se pudo conectar con el proveedor. Revisa la URL, el modelo y la API key.']);
});

it('rejects an SSRF-prone endpoint', function () {
    $this->postJson('/api/ai/test-connection', [
        'provider' => 'OPENAI',
        'model' => 'gpt-4o-mini',
        'baseUrl' => 'http://localhost:8000/v1',
        'apiKey' => 'sk-test',
    ])
        ->assertStatus(400)
        ->assertJson(['error' => 'Este proveedor solo admite endpoints locales para CUSTOM u OLLAMA.']);
});
