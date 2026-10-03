<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\AuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSession
{
    public function __construct(private readonly AuthService $auth) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie(AuthService::SESSION_COOKIE);

        $user = $token ? $this->auth->getUserByToken($token) : null;

        if (! $user instanceof User) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'UNAUTHORIZED'], 401);
            }

            return redirect()->guest(route('login', ['next' => $request->fullUrl()]));
        }

        $request->attributes->set('auth_user', $user);
        $request->attributes->set('auth_token', $token);

        return $next($request);
    }
}
