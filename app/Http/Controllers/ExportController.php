<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\User;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ExportController extends Controller
{
    public function __construct(private readonly ActivityRepositoryInterface $activities) {}

    public function show(Request $request): Response
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $format = $request->query('format', 'csv');

        $parsed = $this->parseRange($from, $to);

        if ($parsed === null) {
            return response()->json(['error' => 'Rango de fechas no válido.'], 400);
        }

        [$fromDate, $toDate] = $parsed;

        try {
            $user = $request->attributes->get('auth_user');
            $rows = $this->activities->findByUserRange($user->id, $fromDate, $toDate);

            if ($format === 'json') {
                return response()->json([
                    'user' => $this->safeUser($user),
                    'activities' => $rows->map(fn (Activity $a) => [
                        'id' => $a->id,
                        'userId' => $a->user_id,
                        'categoryId' => $a->category_id,
                        'title' => $a->title,
                        'description' => $a->description,
                        'date' => $a->date?->toIso8601String(),
                        'startAt' => $a->start_at?->toIso8601String(),
                        'endAt' => $a->end_at?->toIso8601String(),
                        'status' => $a->status,
                        'points' => $a->points,
                        'isFree' => $a->is_free,
                        'completedAt' => $a->completed_at?->toIso8601String(),
                        'createdAt' => $a->created_at?->toIso8601String(),
                        'updatedAt' => $a->updated_at?->toIso8601String(),
                        'category' => $a->relationLoaded('category') && $a->category !== null ? [
                            'id' => $a->category->id,
                            'userId' => $a->category->user_id,
                            'name' => $a->category->name,
                            'color' => $a->category->color,
                            'pointsPerHour' => $a->category->points_per_hour,
                        ] : null,
                    ])->values(),
                ]);
            }

            $lines = ['Actividad,Categoria,Inicio,Fin,Estado,Puntos'];

            foreach ($rows as $activity) {
                $lines[] = implode(',', array_map(
                    fn (mixed $value) => '"'.str_replace('"', '""', (string) $value).'"',
                    [
                        $activity->title,
                        $activity->relationLoaded('category') && $activity->category !== null ? $activity->category->name : 'Sin categoría',
                        $activity->start_at?->format('Y-m-d\TH:i:s.u\Z'),
                        $activity->end_at?->format('Y-m-d\TH:i:s.u\Z'),
                        $activity->status,
                        $activity->points,
                    ],
                ));
            }

            return response(implode("\n", $lines)."\n")
                ->header('Content-Type', 'text/csv; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename=timelock-export.csv');
        } catch (\Throwable) {
            return response()->json(['error' => 'Sesión no válida.'], 401);
        }
    }

    /**
     * @return array{0: ?DateTimeImmutable, 1: ?DateTimeImmutable}|null
     */
    private function parseRange(mixed $from, mixed $to): ?array
    {
        if ($from !== null && ! $this->isDateString($from)) {
            return null;
        }

        if ($to !== null && ! $this->isDateString($to)) {
            return null;
        }

        $fromDate = $from !== null ? new DateTimeImmutable($from.'T00:00:00.000Z') : null;
        $toDate = $to !== null ? new DateTimeImmutable($to.'T23:59:59.999Z') : null;

        if ($fromDate === false || $toDate === false) {
            return null;
        }

        return [$fromDate, $toDate];
    }

    private function isDateString(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        try {
            $dt = new DateTimeImmutable($value, new DateTimeZone('UTC'));

            return $dt->format('Y-m-d') === $value;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function safeUser(User $user): array
    {
        $settingsKeys = [
            'theme', 'operationMode', 'timezoneOverride', 'timeFormat', 'measurementUnit',
            'notificationsEnabled', 'notificationTypes', 'notificationFrequency',
            'quietHoursStart', 'quietHoursEnd', 'voiceEnabled', 'notifyVolume',
            'notificationVoice', 'generationPersonalization', 'avoidRecentActivities',
            'recentActivitiesWindow', 'includeCompletedHistory', 'profileVisibility',
            'aiProvider', 'aiModel', 'aiBaseUrl', 'aiTemperature', 'aiMaxTokens',
        ];

        $settings = [];

        foreach ($settingsKeys as $key) {
            $settings[$key] = $user->getAttribute(Str::snake($key));
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'country' => $user->country,
            'city' => $user->city,
            'timezone' => $user->timezone,
            'language' => $user->language,
            'settings' => $settings,
        ];
    }
}
