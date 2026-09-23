<?php

namespace App\Repositories\Contracts;

use App\Models\QrLoginToken;
use DateTimeInterface;

interface QrLoginTokenRepositoryInterface
{
    public function create(string $userId, string $tokenHash, DateTimeInterface $expiresAt): QrLoginToken;

    public function findByHash(string $tokenHash): ?QrLoginToken;

    public function consume(string $id): bool;

    public function deleteUnused(string $userId): int;

    public function prune(): int;
}
