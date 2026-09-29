<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $service) {}

    public function list(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $from = $request->query('from');
        $to = $request->query('to');
        $fromDt = $from ? \Carbon\Carbon::parse($from)->startOfDay() : \Carbon\Carbon::today();
        $toDt = $to ? \Carbon\Carbon::parse($to)->endOfDay() : \Carbon\Carbon::today()->endOfDay();
        $items = $this->service->listByRange($user->id, $fromDt, $toDt);
        $summary = $this->service->summary($user->id, $fromDt, $toDt);
        return response()->json([
            'items' => $items->map(fn($a)=>[
                'id'=>$a->id,
                'type'=>$a->type,
                'started_at'=>$a->started_at,
                'ended_at'=>$a->ended_at,
                'duration_minutes'=>$a->duration_minutes,
            ]),
            'summary'=>$summary,
        ]);
    }

    public function toggle(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $type = $request->input('type');
        $attendance = $this->service->toggle($user->id, $type);
        return response()->json(['attendance' => $attendance]);
    }
}
