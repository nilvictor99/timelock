<?php

namespace App\Repositories\Contracts;

use App\Models\QrLoginToken;
use DateTimeInterface;

interface QrLoginTokenRepositoryInterface
{
    /**
     * @param  DateTimeInterface|null  $expiresAt  null means the token never expires.
     * @param  int|null  $maxUses  null means the token has no use budget.
     */
    public function create(string $userId, string $tokenHash, ?DateTimeInterface $expiresAt, ?int $maxUses): QrLoginToken;

    public function findByHash(string $tokenHash): ?QrLoginToken;

    /**
     * Spends one use of the token, enforcing lifetime and budget in the
     * database so two simultaneous requests cannot both spend the last use.
     *
     * @return bool false when the token is gone, expired or exhausted.
     */
    public function recordUse(string $id): bool;

    /**
     * Revokes every token of the user: only one QR is active at a time.
     */
    public function deleteAll(string $userId): int;

    /**
     * Drops expired and exhausted tokens, keeping perpetual ones alive.
     */
    public function prune(): int;
}
