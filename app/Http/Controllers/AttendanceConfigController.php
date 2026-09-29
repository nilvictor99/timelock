<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceConfigController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $data = $request->validate([
            'attendance_qr_ttl' => 'required|integer|min:1',
            'attendance_qr_ttl_unit' => 'required|string|in:minutes,days,never',
            'attendance_close_on_rescan' => 'nullable|boolean',
        ]);

        $user->attendance_qr_ttl = $data['attendance_qr_ttl'];
        $user->attendance_qr_ttl_unit = $data['attendance_qr_ttl_unit'];
        $user->attendance_close_on_rescan = $data['attendance_close_on_rescan'] ?? $user->attendance_close_on_rescan;
        $user->save();

        return response()->json([
            'attendance_qr_ttl' => $user->attendance_qr_ttl,
            'attendance_qr_ttl_unit' => $user->attendance_qr_ttl_unit,
            'attendance_close_on_rescan' => (bool)$user->attendance_close_on_rescan,
        ]);
    }
}
