<?php

namespace App\Http\Controllers;

use App\Services\AiService;
use App\Services\Exceptions\InvalidAiEndpointException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AiController extends Controller
{
    private const PROVIDERS = ['NVIDIA_NIM', 'OPENROUTER', 'OPENAI', 'ANTHROPIC', 'GOOGLE_GEMINI', 'OLLAMA', 'CUSTOM', 'OPENCODE'];

    public function __construct(private readonly AiService $ai) {}

    public function testConnection(Request $request): JsonResponse
    {
        $body = $request->json()->all();

        $provider = $body['provider'] ?? null;
        $model = is_string($body['model'] ?? null) ? trim($body['model']) : null;
        $baseUrl = is_string($body['baseUrl'] ?? null) ? trim($body['baseUrl']) : null;
        $apiKey = $body['apiKey'] ?? null;

        if (! is_string($provider) || ! in_array($provider, self::PROVIDERS, true)
            || (is_string($model) && mb_strlen($model) > 160)
            || (is_string($baseUrl) && (mb_strlen($baseUrl) > 500 || ($baseUrl !== '' && filter_var($baseUrl, FILTER_VALIDATE_URL) === false)))
            || ! is_string($apiKey) || $apiKey === '' || mb_strlen($apiKey) > 1000) {
            return response()->json(['error' => 'Proveedor, modelo y API key son obligatorios.'], 400);
        }

        try {
            $this->ai->testConnection($provider, $model, $baseUrl, $apiKey);

            return response()->json(['ok' => true]);
        } catch (InvalidAiEndpointException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (Throwable $e) {
            $message = str_starts_with($e->getMessage(), 'El proveedor respondió con HTTP')
                ? $e->getMessage()
                : 'No se pudo conectar con el proveedor. Revisa la URL, el modelo y la API key.';

            return response()->json(['error' => $message], 502);
        }
    }
}
