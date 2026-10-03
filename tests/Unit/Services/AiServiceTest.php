<?php

use App\Services\AiService;

it('accepts the authorized host for a known provider over https', function () {
    $service = new AiService(fn (string $host): array => ['104.18.24.25']);

    expect($service->validateAiEndpoint('OPENAI', 'https://api.openai.com/v1/chat/completions'))
        ->toBe('https://api.openai.com/v1/chat/completions');
});

it('rejects wrong hosts, http and embedded credentials', function () {
    $service = new AiService;

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'https://evil.example.com/v1'))
        ->toThrow(RuntimeException::class, 'host autorizado');

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'http://api.openai.com/v1'))
        ->toThrow(RuntimeException::class, 'host autorizado');

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'https://user:pass@api.openai.com/v1'))
        ->toThrow(RuntimeException::class, 'sin credenciales');

    expect(fn () => $service->validateAiEndpoint('UNKNOWN', 'https://api.openai.com/v1'))
        ->toThrow(RuntimeException::class, 'host autorizado');
});

it('rejects invalid urls and non-http protocols', function () {
    $service = new AiService;

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'not-a-url'))
        ->toThrow(RuntimeException::class, 'no es válida');

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'ftp://api.openai.com/x'))
        ->toThrow(RuntimeException::class, 'HTTP(S)');
});

it('only allows local endpoints for CUSTOM and OLLAMA', function () {
    $service = new AiService;

    expect($service->validateAiEndpoint('CUSTOM', 'http://127.0.0.1:11434/v1/chat/completions'))
        ->toBe('http://127.0.0.1:11434/v1/chat/completions');

    expect($service->validateAiEndpoint('OLLAMA', 'http://localhost:11434/api/chat'))
        ->toBe('http://localhost:11434/api/chat');

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'http://localhost:11434/v1'))
        ->toThrow(RuntimeException::class, 'CUSTOM u OLLAMA');
});

it('rejects endpoints resolving to private networks', function () {
    $service = new AiService(fn (string $host): array => ['127.0.0.1']);

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'https://api.openai.com/v1'))
        ->toThrow(RuntimeException::class, 'red privada');
});

it('treats IPv6 ULA and link-local as private', function () {
    $service = new AiService(fn (string $host): array => ['fd00::1']);

    expect(fn () => $service->validateAiEndpoint('OPENAI', 'https://api.openai.com/v1'))
        ->toThrow(RuntimeException::class, 'red privada');
});
