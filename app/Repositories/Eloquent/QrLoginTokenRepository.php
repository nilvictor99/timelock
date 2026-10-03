<?php

namespace App\Repositories\Eloquent;

use App\Models\QrLoginToken;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class QrLoginTokenRepository implements QrLoginTokenRepositoryInterface
{
    public function create(string $userId, string $tokenHash, ?DateTimeInterface $expiresAt, ?int $maxUses): QrLoginToken
    {
        return QrLoginToken::create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'max_uses' => $maxUses,
            'uses_count' => 0,
        ]);
    }

    public function findByHash(string $tokenHash): ?QrLoginToken
    {
        return QrLoginToken::where('token_hash', $tokenHash)->first();
    }

    /**
     * The conditions live inside the UPDATE, not in a read beforehand: a
     * single-use token must not be spendable twice by two concurrent requests.
     * A null expires_at or max_uses is a real option ("never"/"unlimited"), so
     * those columns are skipped instead of compared.
     */
    public function recordUse(string $id): bool
    {
        return QrLoginToken::whereKey($id)
            ->where(fn (Builder $query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>', now()))
            ->where(fn (Builder $query) => $query
                ->whereNull('max_uses')
                ->orWhereColumn('uses_count', '<', 'max_uses'))
            ->update([
                'uses_count' => DB::raw('uses_count + 1'),
                'used_at' => now(),
            ]) === 1;
    }

    public function deleteAll(string $userId): int
    {
        return QrLoginToken::where('user_id', $userId)->delete();
    }

    public function prune(): int
    {
        return QrLoginToken::where(function (Builder $query) {
            $query
                ->where('expires_at', '<=', now())
                ->orWhere(function (Builder $inner) {
                    $inner
                        ->whereNotNull('max_uses')
                        ->whereColumn('uses_count', '>=', 'max_uses');
                });
        })->delete();
    }
}
