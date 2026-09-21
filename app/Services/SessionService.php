<?php

namespace App\Services;

use App\Models\Session;
use App\Repositories\Contracts\SessionRepositoryInterface;

class SessionService
{
    public function __construct(private readonly SessionRepositoryInterface $sessions) {}

    public function create(string $userId, string $tokenHash, \DateTimeInterface $expiresAt): Session
    {
        return $this->sessions->create($userId, $tokenHash, $expiresAt);
    }

    public function findByTokenHash(string $tokenHash): ?Session
    {
        return $this->sessions->findByTokenHash($tokenHash);
    }

    public function findWithUser(string $tokenHash): ?array
    {
        return $this->sessions->findWithUser($tokenHash);
    }

    public function deleteByTokenHash(string $tokenHash): bool
    {
        return $this->sessions->deleteByTokenHash($tokenHash);
    }

    public function deleteByUser(string $userId): int
    {
        return $this->sessions->deleteByUser($userId);
    }

    public function deleteExpired(): int
    {
        return $this->sessions->deleteExpired();
    }
}
