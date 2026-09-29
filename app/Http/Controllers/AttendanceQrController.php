<?php

namespace App\Http\Controllers;

use App\Models\AttendanceQrToken;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class AttendanceQrController extends Controller
{
    public function generate(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $type = $request->input('type','WORK');

        $ttl = (int)$user->attendance_qr_ttl;
        $unit = $user->attendance_qr_ttl_unit;

        $expiresAt = null;
        if ($unit !== 'never') {
            $expiresAt = Carbon::now()->addMinutes($unit === 'days' ? $ttl * 1440 : $ttl);
        }

        $token = Str::random(32);
        $hash = hash('sha256',$token);

        AttendanceQrToken::where('user_id',$user->id)->where('type',$type)->delete();

        AttendanceQrToken::create([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'type' => $type,
            'token_hash' => $hash,
            'expires_at' => $expiresAt,
        ]);

        return response()->json(['token' => $token, 'expires_at' => $expiresAt, 'type' => $type]);
    }
}
