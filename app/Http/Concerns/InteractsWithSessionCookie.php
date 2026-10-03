<?php

namespace App\Http\Concerns;

use App\Services\AuthService;
use DateTimeInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

trait InteractsWithSessionCookie
{
    private function withSessionCookie(Response $response, string $token, DateTimeInterface $expiresAt): Response
    {
        return $response->withCookie($this->sessionCookieConfig($token, $expiresAt));
    }

    private function sessionCookieConfig(string $token, DateTimeInterface $expiresAt): Cookie
    {
        return Cookie::create(
            AuthService::SESSION_COOKIE,
            $token,
            $expiresAt,
            '/',
            null,
            app()->environment('production'),
            true,
            false,
            'Lax',
        );
    }

    private function clearSessionCookie(Response $response): Response
    {
        return $response->withCookie($this->sessionCookieConfig('', now()->subHour()));
    }
}
