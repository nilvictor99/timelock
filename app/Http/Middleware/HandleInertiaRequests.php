<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $this->resolveUser($request);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'locale' => $this->resolveLocale($request, $user),
        ];
    }

    private function resolveUser(Request $request): ?User
    {
        $candidate = $request->attributes->get('auth_user');

        if ($candidate instanceof User) {
            return $candidate;
        }

        $token = $request->cookie(AuthService::SESSION_COOKIE);

        if (! is_string($token) || $token === '') {
            return null;
        }

        return app(AuthService::class)->getUserByToken($token);
    }

    private function resolveLocale(Request $request, ?User $user): string
    {
        $language = $user?->language;

        if ($language === 'en' || $language === 'es') {
            return strtolower($language);
        }

        return $request->cookie('timelock_locale') === 'en' ? 'en' : 'es';
    }
}
