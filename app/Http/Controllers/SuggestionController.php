<?php

namespace App\Http\Controllers;

use App\Http\Concerns\SerializesDomain;
use App\Models\Activity;
use App\Models\Suggestion;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Services\AiService;
use App\Services\SuggestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SuggestionController extends Controller
{
    use SerializesDomain;

    private const RATE_LIMIT_MAX = 5;

    private const RATE_LIMIT_MINUTES = 10;

    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
        private readonly SuggestionService $suggestions,
        private readonly AiService $ai,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $recent = $this->suggestions->findRecent($user->id, 5);

        return response()->json([
            'suggestions' => $recent->map(fn (Suggestion $s) => $this->suggestionPayload($s))->values(),
            'source' => $recent->first()?->source ?? 'rule',
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $action = $request->json('action', 'generate');

        if (! is_string($action) || ! in_array($action, ['generate', 'regenerate'], true)) {
            return response()->json(['error' => 'Solicitud de sugerencias no válida.'], 400);
        }

        $limited = $this->consumeRateLimit($user->id);

        if ($limited !== null) {
            return response()->json([
                'error' => 'Has alcanzado el límite temporal de regeneraciones. Inténtalo más tarde.',
                'retryAfter' => $limited,
            ], 429)->header('Retry-After', (string) $limited);
        }

        $from = now()->subDays(7);
        $recentActivities = $this->activities->findRecent($user->id, $from, now(), 100);

        $history = $recentActivities->map(fn (Activity $a) => [
            'title' => $a->title,
            'category' => $a->relationLoaded('category') && $a->category !== null ? $a->category->name : null,
            'status' => $a->status,
            'startAt' => $a->start_at?->format('Y-m-d\\TH:i:s'),
            'endAt' => $a->end_at?->format('Y-m-d\\TH:i:s'),
            'points' => $a->points,
        ])->values()->all();

        $result = $this->ai->suggest(
            $this->publicUser($user),
            $history,
            (int) $user->current_streak,
            (int) $user->points,
            gmdate('Y-m-d'),
        );

        $source = $result['provider'] !== null ? 'ai' : 'rule';
        $generationId = (string) Str::uuid();

        $rows = array_map(
            fn (array $value, int $index) => [
                'user_id' => $user->id,
                'generation_id' => $generationId,
                'title' => $value['title'],
                'category' => $value['category'],
                'duration' => $value['duration'],
                'reason' => $value['reason'],
                'points' => $value['points'],
                'suggested_time' => $value['time'],
                'source' => $source,
            ],
            $result['values'],
            array_keys($result['values']),
        );

        try {
            $this->suggestions->createMany($rows);

            $suggestions = $this->suggestions->findByGeneration($user->id, $generationId)
                ->map(fn (Suggestion $s) => $this->suggestionPayload($s))
                ->values();
        } catch (\Throwable) {
            $suggestions = collect($rows)->map(function (array $row, int $index) use ($generationId, $source) {
                $payload = [
                    'id' => 'transient-'.$generationId.'-'.$index,
                    'userId' => $row['user_id'],
                    'generationId' => $generationId,
                    'title' => $row['title'],
                    'category' => $row['category'],
                    'duration' => $row['duration'],
                    'reason' => $row['reason'],
                    'points' => $row['points'],
                    'suggestedTime' => $row['suggested_time'],
                    'source' => $source,
                    'createdAt' => now()->format('Y-m-d\\TH:i:s'),
                ];

                return $payload;
            })->values();
        }

        $payload = [
            'suggestions' => $suggestions,
            'source' => $source,
            'provider' => $source === 'ai' ? $result['provider'] : null,
            'action' => $action,
        ];

        if ($result['warning'] !== null) {
            $payload['warning'] = $result['warning'];
        }

        return response()->json($payload);
    }

    private function consumeRateLimit(string $userId): ?int
    {
        $store = Cache::store('file');
        $key = 'suggestion-rate:'.$userId;
        $resetKey = $key.':reset';

        $resetAt = (int) $store->get($resetKey, 0);

        if ($resetAt <= now()->getTimestamp()) {
            $store->put($key, 1, self::RATE_LIMIT_MINUTES * 60);
            $store->put($resetKey, now()->addMinutes(self::RATE_LIMIT_MINUTES)->getTimestamp(), self::RATE_LIMIT_MINUTES * 60);

            return null;
        }

        $count = ((int) $store->get($key, 0)) + 1;

        $store->put($key, $count, self::RATE_LIMIT_MINUTES * 60);

        return $count > self::RATE_LIMIT_MAX ? max(0, $resetAt - now()->getTimestamp()) : null;
    }
}
