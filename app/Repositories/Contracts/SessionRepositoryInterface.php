<?php

namespace App\Repositories\Contracts;

use App\Models\Session;
use DateTimeInterface;

interface SessionRepositoryInterface
{
    public function create(string $userId, string $tokenHash, DateTimeInterface $expiresAt): Session;

    public function findByTokenHash(string $tokenHash): ?Session;

    public function findWithUser(string $tokenHash): array;

    public function deleteByTokenHash(string $tokenHash): bool;

    public function deleteByUser(string $userId): int;

    public function deleteExpired(): int;
}
