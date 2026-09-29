<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ParsesStatsFilters;
use App\Models\Activity;
use App\Models\User;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ExportController extends Controller
{
    use ParsesStatsFilters;

    public function __construct(private readonly ActivityRepositoryInterface $activities) {}

    public function show(Request $request): Response
    {
        $format = $request->query('format', 'csv');

        $parsed = $this->parseOptionalRange($request->query('from'), $request->query('to'));

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

            $rows = $this->applyFilters(
                $rows,
                $this->csvIds($request->query('activities')),
                $this->csvIds($request->query('categories')),
            );

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
     * Aplica los filtros de actividades y categorías al CSV.
     * null o array vacío = sin filtro (misma semántica que StatsService).
     *
     * @param  array<int, string>|null  $activityIds
     * @param  array<int, string>|null  $categoryIds
     * @return Collection<int, Activity>
     */
    private function applyFilters(Collection $rows, ?array $activityIds, ?array $categoryIds): Collection
    {
        if ($activityIds) {
            $rows = $rows->whereIn('id', $activityIds);
        }

        if ($categoryIds) {
            $rows = $rows->whereIn('category_id', $categoryIds);
        }

        return $rows;
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
