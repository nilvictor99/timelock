<?php

namespace App\Http\Controllers;

use App\Http\Concerns\InteractsWithSessionCookie;
use App\Http\Requests\GenerateQrRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuthController extends Controller
{
    use InteractsWithSessionCookie;

    public function __construct(
        private readonly AuthService $auth,
        private readonly UserRepositoryInterface $users,
    ) {}

    public function showLogin(Request $request)
    {
        return Inertia::render('Login', [
            'next' => $request->query('next'),
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $session = $this->auth->login(
            $validated['email'],
            $validated['password'],
            $validated['remember'] ?? false,
        );

        if ($session === null) {
            return back()->withErrors(['auth' => 'Credenciales incorrectas.']);
        }

        return $this->withSessionCookie(
            redirect()->intended($session['user']->onboarding_completed ? route('dashboard') : route('onboarding')),
            $session['token'],
            $session['expiresAt'],
        );
    }

    public function showRegister(Request $request)
    {
        return Inertia::render('Register');
    }

    public function register(RegisterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($this->users->findByEmail($validated['email']) !== null) {
            return back()->withErrors(['email' => 'Ya existe una cuenta con ese correo.']);
        }

        $result = $this->auth->register($validated, $validated['remember'] ?? false);

        return $this->withSessionCookie(
            redirect()->route('onboarding'),
            $result['token'],
            $result['expiresAt'],
        );
    }

    public function logout(Request $request): RedirectResponse
    {
        $token = $request->cookie(AuthService::SESSION_COOKIE);

        if ($token) {
            $this->auth->logout($token);
        }

        $response = redirect()->route('home');
        $response->withCookie($this->sessionCookieConfig('', now()->subHour()));

        return $response;
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user')
            ?? ($request->cookie(AuthService::SESSION_COOKIE)
                ? $this->auth->getUserByToken($request->cookie(AuthService::SESSION_COOKIE))
                : null);

        if (! $user instanceof User) {
            return response()->json(['error' => 'UNAUTHORIZED'], 401);
        }

        return response()->json(['user' => $user]);
    }

    public function qr(GenerateQrRequest $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        if (! $user instanceof User) {
            return response()->json(['error' => 'UNAUTHORIZED'], 401);
        }

        $qr = $this->auth->createQrToken($user, $request->ttlKey(), $request->useKey());

        return response()
            ->json([
                'token' => $qr['token'],
                'expiresAt' => $qr['expiresAt']?->toIso8601String(),
                'maxUses' => $qr['maxUses'],
                'ttl' => $qr['ttlKey'],
                'uses' => $qr['useKey'],
                'perpetual' => $qr['perpetual'],
            ])
            ->header('Cache-Control', 'no-store');
    }

    public function qrLogin(Request $request): JsonResponse
    {
        $token = $request->input('token');

        if (! is_string($token) || $token === '') {
            return response()->json(['error' => 'Token inválido.'], 422);
        }

        $user = $this->auth->loginWithQr($token);

        if (! $user instanceof User) {
            return response()->json(['error' => 'Token inválido o ya usado.'], 401);
        }

        $session = $this->auth->createSession($user, true);

        $response = response()->json([
            'ok' => true,
            'redirect' => $user->onboarding_completed ? route('dashboard') : route('onboarding'),
        ], 200);
        $response->withCookie($this->sessionCookieConfig($session['token'], $session['expiresAt']));

        return $response;
    }
}
