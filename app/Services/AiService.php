<?php

namespace App\Services;

use App\Services\Exceptions\InvalidAiEndpointException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiService
{
    /**
     * Hosts autorizados por proveedor (port 1:1 de src/lib/ai/endpoints.ts).
     *
     * @var array<string, list<string>>
     */
    private const PROVIDER_HOSTS = [
        'OPENAI' => ['api.openai.com'],
        'OPENROUTER' => ['openrouter.ai'],
        'NVIDIA_NIM' => ['integrate.api.nvidia.com'],
        'ANTHROPIC' => ['api.anthropic.com'],
        'GOOGLE_GEMINI' => ['generativelanguage.googleapis.com'],
        'OPENCODE' => ['opencode.ai'],
    ];

    /**
     * @var list<string>
     */
    private const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', 'host.docker.internal'];

    /**
     * @var callable(string): array<int, string>|null
     */
    private $resolver;

    /**
     * @param  callable(string): array<int, string>|null  $resolver  Para testear sin DNS real.
     */
    public function __construct(?callable $resolver = null)
    {
        $this->resolver = $resolver;
    }

    public function validateAiEndpoint(string $provider, string $rawUrl): string
    {
        $url = parse_url($rawUrl);

        if ($url === false || ! isset($url['scheme'], $url['host'])) {
            throw new InvalidAiEndpointException('La URL del proveedor no es válida.');
        }

        if (! in_array($url['scheme'], ['http', 'https'], true)) {
            throw new InvalidAiEndpointException('El endpoint de IA debe usar HTTP(S) sin credenciales en la URL.');
        }

        if (isset($url['user']) || isset($url['pass'])) {
            throw new InvalidAiEndpointException('El endpoint de IA debe usar HTTP(S) sin credenciales en la URL.');
        }

        $hostname = self::normalizeHostname($url['host']);

        if (in_array($hostname, self::LOCAL_HOSTNAMES, true)) {
            if ($provider !== 'CUSTOM' && $provider !== 'OLLAMA') {
                throw new InvalidAiEndpointException('Este proveedor solo admite endpoints locales para CUSTOM u OLLAMA.');
            }

            return $rawUrl;
        }

        $allowedHosts = self::PROVIDER_HOSTS[$provider] ?? null;

        if ($allowedHosts === null || ! in_array($hostname, $allowedHosts, true) || $url['scheme'] !== 'https') {
            throw new InvalidAiEndpointException('El endpoint de IA debe usar el host autorizado y HTTPS.');
        }

        $this->assertPublicResolution($hostname);

        return $rawUrl;
    }

    private static function normalizeHostname(string $hostname): string
    {
        $hostname = mb_strtolower($hostname);

        if (str_starts_with($hostname, '[') && str_ends_with($hostname, ']')) {
            $hostname = substr($hostname, 1, -1);
        }

        return rtrim($hostname, '.');
    }

    private function assertPublicResolution(string $hostname): void
    {
        $addresses = $this->resolve($hostname);

        if ($addresses === [] || array_any($addresses, fn (string $ip) => self::isPrivateIp($ip))) {
            throw new InvalidAiEndpointException('El endpoint de IA no puede apuntar a una red privada.');
        }
    }

    /**
     * @return list<string> IPs resueltas del hostname.
     */
    private function resolve(string $hostname): array
    {
        if ($this->resolver !== null) {
            return call_user_func($this->resolver, $hostname);
        }

        $ips = [];
        $records = @dns_get_record($hostname, DNS_A | DNS_AAAA);

        if ($records === false) {
            return [];
        }

        foreach ($records as $record) {
            if (isset($record['ipv4'])) {
                $ips[] = $record['ipv4'];
            }
            if (isset($record['ipv6'])) {
                $ips[] = $record['ipv6'];
            }
        }

        return $ips;
    }

    private static function isPrivateIp(string $ip): bool
    {
        if (str_starts_with($ip, '::ffff:')) {
            return self::isPrivateIp(substr($ip, 7));
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = array_map('intval', explode('.', $ip));

            if (($parts[0] ?? null) !== null && $parts[0] === 0) {
                return true;
            }

            if ($parts[0] === 10) {
                return true;
            }

            if ($parts[0] === 127) {
                return true;
            }

            if ($parts[0] === 255) {
                return true;
            }

            if ($parts[0] === 100 && $parts[1] >= 64 && $parts[1] <= 127) {
                return true;
            }

            if ($parts[0] === 169 && $parts[1] === 254) {
                return true;
            }

            if ($parts[0] === 172 && $parts[1] >= 16 && $parts[1] <= 31) {
                return true;
            }

            if ($parts[0] === 192 && $parts[1] === 168) {
                return true;
            }

            if ($parts[0] === 192 && ($parts[1] === 0 || $parts[1] === 18)) {
                return true;
            }

            if ($parts[0] === 198 && ($parts[1] === 18 || $parts[1] === 19)) {
                return true;
            }

            if ($parts[0] === 203 && $parts[1] === 0 && $parts[2] === 113) {
                return true;
            }

            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $lower = mb_strtolower($ip);

            if ($lower === '::' || $lower === '::1') {
                return true;
            }

            $hextets = explode(':', $lower);
            $first = $hextets[0] ?? '';

            if (str_starts_with($first, 'fc')) {
                return true;
            }

            if (str_starts_with($first, 'fd')) {
                return true;
            }

            if (str_starts_with($first, 'fe8') || str_starts_with($first, 'fe9') || str_starts_with($first, 'fea') || str_starts_with($first, 'feb')) {
                return true;
            }

            return false;
        }

        return true;
    }

    public function defaultModel(string $provider): string
    {
        return match ($provider) {
            'OPENAI' => 'gpt-4o-mini',
            'OPENROUTER' => 'openai/gpt-4o-mini',
            'NVIDIA_NIM' => 'meta/llama-3.1-8b-instruct',
            'CUSTOM' => 'gpt-4o-mini',
            'ANTHROPIC' => 'claude-3-5-haiku-latest',
            'GOOGLE_GEMINI' => 'gemini-1.5-flash',
            'OLLAMA' => 'llama3.2',
            'OPENCODE' => 'deepseek-v4-flash',
            default => 'gpt-4o-mini',
        };
    }

    public function apiKeyFor(string $provider): string
    {
        return match ($provider) {
            'NVIDIA_NIM' => (string) (env('NVIDIA_API_KEY') ?? env('NVIDIA_NIM_API_KEY', '')),
            'CUSTOM' => (string) (env('CUSTOM_AI_API_KEY') ?? env('AI_API_KEY', '')),
            'GOOGLE_GEMINI' => (string) (env('GEMINI_API_KEY') ?? env('GOOGLE_GEMINI_API_KEY', '')),
            'OLLAMA' => (string) env('OLLAMA_API_KEY', ''),
            default => (string) env($provider.'_API_KEY', ''),
        };
    }

    public function defaultBaseUrlFor(string $provider): ?string
    {
        return match ($provider) {
            'OPENAI' => env('OPENAI_BASE_URL') ?: 'https://api.openai.com/v1',
            'OPENROUTER' => env('OPENROUTER_BASE_URL') ?: 'https://openrouter.ai/api/v1',
            'NVIDIA_NIM' => env('NVIDIA_BASE_URL') ?: 'https://integrate.api.nvidia.com/v1',
            'OPENCODE' => env('OPENCODE_BASE_URL') ?: 'https://opencode.ai/v1',
            'CUSTOM' => env('CUSTOM_AI_BASE_URL') ?: env('AI_BASE_URL'),
            'OLLAMA' => 'http://127.0.0.1:11434',
            default => env($provider.'_BASE_URL'),
        };
    }

    public function testConnection(string $provider, ?string $model, ?string $baseUrl, string $apiKey): void
    {
        if ($baseUrl !== null && $baseUrl !== '') {
            $baseUrl = $this->validateAiEndpoint($provider, $baseUrl);
        }

        $model ??= $this->defaultModel($provider);

        $response = match ($provider) {
            'OLLAMA' => $this->http($baseUrl ?: $this->defaultBaseUrlFor($provider))
                ->withOptions(['timeout' => 10])
                ->withHeaders($apiKey !== '' ? ['Authorization' => 'Bearer '.$apiKey] : [])
                ->get(static::ensureTrailing($baseUrl ?: $this->defaultBaseUrlFor($provider), '/api/tags')),
            'ANTHROPIC' => $this->http()
                ->withOptions(['timeout' => 10])
                ->withHeaders(['x-api-key' => $apiKey, 'anthropic-version' => '2023-06-01'])
                ->post(rtrim($baseUrl ?: $this->defaultBaseUrlFor($provider), '/').'/v1/messages', [
                    'model' => $model, 'max_tokens' => 1,
                    'messages' => [['role' => 'user', 'content' => 'Reply with OK.']],
                ]),
            'GOOGLE_GEMINI' => $this->http()
                ->withOptions(['timeout' => 10])
                ->post(static::geminiUrl($baseUrl, $model, $apiKey), [
                    'contents' => [['parts' => [['text' => 'Reply with OK.']]]],
                    'generationConfig' => ['maxOutputTokens' => 1],
                ]),
            default => $this->http()
                ->withOptions(['timeout' => 10])
                ->withHeaders($apiKey !== '' ? ['Authorization' => 'Bearer '.$apiKey] : [])
                ->post(rtrim($baseUrl ?: $this->defaultBaseUrlFor($provider), '/').'/chat/completions', [
                    'model' => $model, 'max_tokens' => 1,
                    'messages' => [['role' => 'user', 'content' => 'Reply with OK.']],
                ]),
        };

        if (! $response->ok()) {
            throw new RuntimeException('El proveedor respondió con HTTP '.$response->status().'.');
        }
    }

    public function suggest(array $profile, array $history, int $streak, int $points, string $today): array
    {
        $provider = (string) ($profile['aiProvider'] ?? '');
        if ($provider === '') {
            $provider = (string) env('AI_PROVIDER', '');
        }

        $configWarning = ($profile['language'] ?? null) === 'en'
            ? 'Configure a provider and API key to generate AI suggestions.'
            : 'Configura un proveedor y una API key para generar sugerencias con IA.';

        if ($provider === '') {
            return ['values' => $this->fallbackSuggestions($profile, $history), 'provider' => null, 'warning' => $configWarning];
        }

        $model = (string) ($profile['aiModel'] ?? '');
        $model = $model !== '' ? $model : $this->defaultModel($provider);

        $baseUrl = (string) ($profile['aiBaseUrl'] ?? '');
        if ($baseUrl !== '') {
            try {
                $baseUrl = $this->validateAiEndpoint($provider, $baseUrl);
            } catch (RuntimeException) {
                return ['values' => $this->fallbackSuggestions($profile, $history), 'provider' => null, 'warning' => $configWarning];
            }
        } else {
            $baseUrl = (string) ($this->defaultBaseUrlFor($provider) ?? '');
        }

        $apiKey = $this->apiKeyFor($provider);

        if ($provider !== 'OLLAMA' && $apiKey === '') {
            return ['values' => $this->fallbackSuggestions($profile, $history), 'provider' => null, 'warning' => $configWarning];
        }

        $temperature = min(2.0, max(0.0, (float) ($profile['aiTemperature'] ?? 0.7)));
        $maxTokens = (int) min(8192, max(1, (int) ($profile['aiMaxTokens'] ?? 500)));

        try {
            $content = $this->chat($provider, $model, $baseUrl, $apiKey, [
                static::SUGGESTIONS_SYSTEM_PROMPT,
                $this->buildSuggestionsUserPrompt($profile, $history, $streak, $points, $today),
            ], $maxTokens, $temperature);

            $values = $this->parseSuggestions($content);

            return ['values' => $values, 'provider' => $provider, 'warning' => null];
        } catch (Throwable $e) {
            $warning = ($profile['language'] ?? null) === 'en'
                ? 'The AI provider could not generate suggestions. Showing rule-based suggestions.'
                : 'La IA no pudo generar sugerencias. Mostrando sugerencias basadas en reglas.';

            return ['values' => $this->fallbackSuggestions($profile, $history), 'provider' => null, 'warning' => $warning];
        }
    }

    private function chat(string $provider, string $model, string $baseUrl, string $apiKey, array $messages, int $maxTokens, float $temperature): string
    {
        $system = array_shift($messages);
        $user = $messages[0] ?? '';

        $response = match ($provider) {
            'OLLAMA' => $this->http()
                ->withOptions(['timeout' => 60])
                ->withHeaders($apiKey !== '' ? ['Authorization' => 'Bearer '.$apiKey] : [])
                ->post(rtrim($baseUrl, '/').'/api/chat', [
                    'model' => $model, 'stream' => false, 'format' => 'json',
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user],
                    ],
                ]),
            'ANTHROPIC' => $this->http()
                ->withOptions(['timeout' => 60])
                ->withHeaders(['x-api-key' => $apiKey, 'anthropic-version' => '2023-06-01'])
                ->post(rtrim($baseUrl, '/').'/v1/messages', [
                    'model' => $model, 'max_tokens' => $maxTokens,
                    'temperature' => $temperature,
                    'messages' => [['role' => 'user', 'content' => $system."\n\n".$user]],
                ]),
            'GOOGLE_GEMINI' => $this->http()
                ->withOptions(['timeout' => 60])
                ->post(static::geminiUrl($baseUrl, $model, $apiKey), [
                    'contents' => [['parts' => [['text' => $system."\n\n".$user]]]],
                    'generationConfig' => ['maxOutputTokens' => $maxTokens, 'temperature' => $temperature],
                ]),
            default => $this->http()
                ->withOptions(['timeout' => 60])
                ->withHeaders($apiKey !== '' ? ['Authorization' => 'Bearer '.$apiKey] : [])
                ->post(rtrim($baseUrl, '/').'/chat/completions', [
                    'model' => $model, 'max_tokens' => $maxTokens, 'temperature' => $temperature,
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user', 'content' => $user],
                    ],
                ]),
        };

        if (! $response->ok()) {
            throw new RuntimeException('Provider HTTP '.$response->status());
        }

        $data = $response->json();

        $content = match ($provider) {
            'ANTHROPIC' => (string) ($data['content'][0]['text'] ?? ''),
            'GOOGLE_GEMINI' => (string) ($data['candidates'][0]['content']['parts'][0]['text'] ?? ''),
            'OLLAMA' => (string) ($data['message']['content'] ?? ''),
            default => (string) ($data['choices'][0]['message']['content'] ?? ''),
        };

        if ($content === '') {
            throw new RuntimeException('Empty provider response.');
        }

        return $content;
    }

    public function parseSuggestions(string $content): array
    {
        $json = trim($content);

        if (str_starts_with($json, '```')) {
            $json = preg_replace('/^```(?:json)?/i', '', $json);
            $json = preg_replace('/```$/m', '', (string) $json);
        }

        $data = json_decode(trim((string) $json), true);

        if (! is_array($data)) {
            $span = strstr((string) $json, '[');
            if ($span !== false) {
                $end = strpos($span, ']');
                $data = $end !== false ? json_decode(substr($span, 0, $end + 1), true) : null;
            }
        }

        if (is_array($data) && array_key_exists('suggestions', $data) && is_array($data['suggestions'])) {
            $data = $data['suggestions'];
        }

        if (! is_array($data)) {
            throw new RuntimeException('Respuesta de IA no es JSON.');
        }

        $valid = [];

        foreach ($data as $item) {
            if (! is_array($item)) {
                continue;
            }

            $row = [
                'title' => trim((string) ($item['title'] ?? $item['name'] ?? '')),
                'category' => trim((string) ($item['category'] ?? '')),
                'duration' => (int) ($item['duration'] ?? $item['durationMinutes'] ?? 0),
                'reason' => trim((string) ($item['reason'] ?? '')),
                'points' => (int) ($item['points'] ?? $item['estimatedPoints'] ?? 0),
                'time' => $item['time'] ?? $item['suggestedTime'] ?? null,
            ];

            $time = $row['time'];
            if ($time !== null && is_string($time) && ! preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) {
                $time = null;
            }

            if (
                $row['title'] === '' || mb_strlen($row['title']) > 160
                || $row['category'] === '' || mb_strlen($row['category']) > 60
                || ! is_numeric($row['duration']) || $row['duration'] < 5 || $row['duration'] > 240
                || $row['reason'] === '' || mb_strlen($row['reason']) > 500
                || ! is_numeric($row['points']) || $row['points'] < 0 || $row['points'] > 1000
            ) {
                continue;
            }

            $valid[] = [
                'title' => $row['title'],
                'category' => $row['category'],
                'duration' => $row['duration'],
                'reason' => $row['reason'],
                'points' => $row['points'],
                'time' => $time,
            ];
        }

        if (count($valid) < 3 || count($valid) > 5) {
            throw new RuntimeException('Entre 3 y 5 sugerencias válidas son requeridas.');
        }

        return array_slice($valid, 0, 5);
    }

    public function fallbackSuggestions(array $profile, array $history): array
    {
        $recent = [];
        foreach ($history as $activity) {
            $recent[strtolower(trim((string) ($activity['title'] ?? '')))] = true;
        }

        $hobbies = $profile['hobbies'] ?? [];
        $learning = $profile['learningInterests'] ?? [];
        $sports = $profile['sports'] ?? [];
        $creative = $profile['creativeActivities'] ?? [];

        $interests = array_merge(
            array_is_list($hobbies) ? $hobbies : [],
            array_is_list($learning) ? $learning : [],
            array_is_list($sports) ? $sports : [],
            array_is_list($creative) ? $creative : [],
        );
        $interests = array_values(array_filter($interests, 'is_string'));

        $preferredTypes = $profile['preferredActivityTypes'] ?? [];

        $preferredTypes = array_is_list($preferredTypes)
            ? array_values(array_filter($preferredTypes, 'is_string'))
            : [];

        $preferred = $profile['preferredDuration'] ?? null;
        $duration = is_string($preferred) && preg_match('/^\d+$/', $preferred)
            ? (int) $preferred
            : (int) min(60, max(15, (int) ($profile['dailyAvailableMinutes'] ?? 30)));

        $templates = [
            [($interests[0] ?? '') !== '' ? 'Practica '.$interests[0] : 'Bloque de enfoque profundo', $preferredTypes[0] ?? 'Productiva'],
            [($interests[2] ?? '') !== '' ? 'Sesión de '.$interests[2] : 'Movimiento consciente', 'Física'],
            [($interests[1] ?? '') !== '' ? 'Aprende sobre '.$interests[1] : 'Lectura sin distracciones', 'Mental'],
            [($interests[3] ?? '') !== '' ? 'Crea algo: '.$interests[3] : 'Pausa creativa', 'Creativa'],
            ['Revisión y planificación de mañana', 'Productiva'],
        ];

        $templates = array_values(array_filter(
            $templates,
            fn (array $t) => ! isset($recent[strtolower($t[0])]),
        ));

        if (count($templates) < 3) {
            $templates = [
                [($interests[0] ?? '') !== '' ? 'Practica '.$interests[0] : 'Bloque de enfoque profundo', $preferredTypes[0] ?? 'Productiva'],
                [($interests[2] ?? '') !== '' ? 'Sesión de '.$interests[2] : 'Movimiento consciente', 'Física'],
                [($interests[1] ?? '') !== '' ? 'Aprende sobre '.$interests[1] : 'Lectura sin distracciones', 'Mental'],
            ];
        }

        $values = [];

        foreach (array_slice($templates, 0, 5) as $index => $template) {
            $itemDuration = max(5, $duration - ($index % 2) * 15);

            $values[] = [
                'title' => $template[0],
                'category' => $template[1],
                'duration' => $itemDuration,
                'reason' => 'Basado en tu perfil y actividad reciente.',
                'points' => max(5, (int) round($itemDuration / 10)),
                'time' => null,
            ];
        }

        return $values;
    }

    private function buildSuggestionsUserPrompt(array $profile, array $history, int $streak, int $points, string $today): string
    {
        return json_encode([
            'profile' => $profile,
            'history' => $history,
            'currentStreak' => $streak,
            'points' => $points,
            'today' => $today,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    private function http(): PendingRequest
    {
        return Http::timeout(60);
    }

    private static function ensureTrailing(string $url, string $suffix): string
    {
        return str_ends_with($url, $suffix) ? $url : rtrim($url, '/').$suffix;
    }

    private static function geminiUrl(string $baseUrl, string $model, string $apiKey): string
    {
        $endpoint = rtrim($baseUrl, '/').'/v1beta/models/'.$model.':generateContent';
        $separator = str_contains($endpoint, '?') ? '&' : '?';

        return $endpoint.$separator.'key='.urlencode($apiKey);
    }

    public const SUGGESTIONS_SYSTEM_PROMPT = 'Eres un asistente que planifica actividades saludables. '
        .'Responde ÚNICAMENTE con un objeto JSON con una clave "suggestions" que sea un array de entre 3 y 5 sugerencias, '
        .'cada una con los campos: title (string <=160), category (string <=60), duration (integer 5-240), reason (string <=500), '
        .'points (integer 0-1000) y time (string "HH:mm" o null). '
        .'Ten en cuenta el perfil del usuario, su historial reciente, su racha y sus puntos.';
}
