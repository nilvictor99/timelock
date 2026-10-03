<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Support\Collection;

interface UserRepositoryInterface
{
    public function find(string $id): ?User;

    public function findByEmail(string $email): ?User;

    public function all(): Collection;

    public function createWithDefaults(array $data): User;

    public function update(string $id, array $data): bool;

    public function delete(string $id): bool;

    public function incrementPoints(string $userId, int $points): bool;

    public function decrementPoints(string $userId, int $points): bool;

    public function touchLastAccess(string $userId): bool;
}
