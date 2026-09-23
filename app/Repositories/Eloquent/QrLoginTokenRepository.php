<?php

namespace App\Repositories\Eloquent;

use App\Models\QrLoginToken;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use DateTimeInterface;

class QrLoginTokenRepository implements QrLoginTokenRepositoryInterface
{
    public function create(string $userId, string $tokenHash, DateTimeInterface $expiresAt): QrLoginToken
    {
        return QrLoginToken::create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]);
    }

    public function findByHash(string $tokenHash): ?QrLoginToken
    {
        return QrLoginToken::where('token_hash', $tokenHash)->first();
    }

    public function consume(string $id): bool
    {
        $token = QrLoginToken::find($id);
        if (! $token) {
            return false;
        }

        return $token->update(['used_at' => now()]);
    }

    public function deleteUnused(string $userId): int
    {
        return QrLoginToken::where('user_id', $userId)
            ->where(fn ($query) => $query->whereNull('used_at')->orWhere('expires_at', '<=', now()))
            ->delete();
    }

    public function prune(): int
    {
        return QrLoginToken::where('expires_at', '<=', now())->delete();
    }
}
