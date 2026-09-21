<?php

namespace App\Repositories\Eloquent;

use App\Models\Session;
use App\Repositories\Contracts\SessionRepositoryInterface;
use DateTimeInterface;

class SessionRepository implements SessionRepositoryInterface
{
    public function create(string $userId, string $tokenHash, DateTimeInterface $expiresAt): Session
    {
        return Session::create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);
    }

    public function findByTokenHash(string $tokenHash): ?Session
    {
        return Session::where('token_hash', $tokenHash)->first();
    }

    public function findWithUser(string $tokenHash): array
    {
        $session = Session::with('user')->where('token_hash', $tokenHash)->first();

        return ['session' => $session, 'user' => $session?->user];
    }

    public function deleteByTokenHash(string $tokenHash): bool
    {
        return (bool) Session::where('token_hash', $tokenHash)->delete();
    }

    public function deleteByUser(string $userId): int
    {
        return Session::where('user_id', $userId)->delete();
    }

    public function deleteExpired(): int
    {
        return Session::where('expires_at', '<=', now())->delete();
    }
}
