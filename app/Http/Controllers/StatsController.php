<?php

namespace App\Http\Controllers;

use App\Services\StatsService;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    private const MAX_FILTERS = 100;

    public function __construct(private readonly StatsService $stats) {}

    public function summary(Request $request): JsonResponse
    {
        $parsed = $this->parseRange($request->query('from'), $request->query('to'));

        if ($parsed === null) {
            return response()->json(['error' => 'Rango de fechas no válido.'], 400);
        }

        [$from, $to] = $parsed;

        $user = $request->attributes->get('auth_user');

        return response()->json(
            $this->stats->summary(
                $user->id,
                $user,
                $from,
                $to,
                $this->csvIds($request->query('activities')),
                $this->csvIds($request->query('categories')),
            ),
        );
    }

    /**
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable}|null
     */
    private function parseRange(mixed $from, mixed $to): ?array
    {
        if (! $this->isDateString($from) || ! $this->isDateString($to)) {
            return null;
        }

        $fromDate = new DateTimeImmutable($from.'T00:00:00.000Z', new DateTimeZone('UTC'));
        $toDate = new DateTimeImmutable($to.'T23:59:59.999Z', new DateTimeZone('UTC'));

        return $fromDate <= $toDate ? [$fromDate, $toDate] : null;
    }

    private function isDateString(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        try {
            return (new DateTimeImmutable($value, new DateTimeZone('UTC')))->format('Y-m-d') === $value;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array<int, string>|null
     */
    private function csvIds(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (! is_string($value) || $value === '') {
            return [];
        }

        $ids = array_values(array_unique(array_filter(array_map('trim', explode(',', $value)), fn ($id) => $id !== '')));

        return array_slice($ids, 0, self::MAX_FILTERS);
    }
}
