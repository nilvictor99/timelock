<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $service) {}

    public function list(Request $request)
    {
        return response()->json(['ok'=>true]);
    }

    public function toggle(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $type = $request->input('type');
        $attendance = $this->service->toggle($user->id, $type);
        return response()->json(['attendance' => $attendance]);
    }
}
