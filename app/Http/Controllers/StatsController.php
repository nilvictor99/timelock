<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ParsesStatsFilters;
use App\Services\StatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    use ParsesStatsFilters;

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
}
