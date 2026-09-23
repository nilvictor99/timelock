<?php

namespace App\Services;

use App\Models\QrLoginToken;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use DateTimeInterface;

class QrLoginTokenService
{
    public function __construct(private readonly QrLoginTokenRepositoryInterface $tokens) {}

    public function create(string $userId, string $tokenHash, DateTimeInterface $expiresAt): QrLoginToken
    {
        return $this->tokens->create($userId, $tokenHash, $expiresAt);
    }

    public function findByHash(string $tokenHash): ?QrLoginToken
    {
        return $this->tokens->findByHash($tokenHash);
    }

    public function consume(string $id): bool
    {
        return $this->tokens->consume($id);
    }

    public function deleteUnused(string $userId): int
    {
        return $this->tokens->deleteUnused($userId);
    }

    public function prune(): int
    {
        return $this->tokens->prune();
    }
}
