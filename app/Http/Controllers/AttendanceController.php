<?php

namespace App\Http\Controllers;

use App\Http\Requests\Attendance\ListRequest;
use App\Http\Requests\Attendance\ToggleRequest;
use App\Services\AttendanceService;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $service) {}

    public function list(ListRequest $request)
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validated();
        $from = $data['from'] ?? null;
        $to = $data['to'] ?? null;
        $fromDt = $from ? Carbon::parse($from)->startOfDay() : Carbon::today();
        $toDt = $to ? Carbon::parse($to)->endOfDay() : Carbon::today()->endOfDay();
        $items = $this->service->listByRange($user->id, $fromDt, $toDt);
        $summary = $this->service->summary($user->id, $fromDt, $toDt);

        return response()->json([
            'items' => $items->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'started_at' => $a->started_at,
                'ended_at' => $a->ended_at,
                'duration_minutes' => $a->duration_minutes,
                'location' => $a->location,
                'notes' => $a->notes,
            ]),
            'summary' => $summary,
        ]);
    }

    public function toggle(ToggleRequest $request)
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validated();
        $type = $validated['type'];
        $location = null;
        if (isset($validated['location'])) {
            $location = $validated['location'];
        } else {
            $parts = array_filter([
                'lat' => $validated['lat'] ?? null,
                'lng' => $validated['lng'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);
            if ($parts) {
                $location = json_encode($parts);
            }
        }
        $attendance = $this->service->toggle($user->id, $type, $location);

        return response()->json(['attendance' => $attendance]);
    }
}
