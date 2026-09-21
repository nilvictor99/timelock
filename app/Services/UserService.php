<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Collection;

class UserService
{
    public function __construct(private readonly UserRepositoryInterface $users) {}

    public function findById(string $id): ?User
    {
        return $this->users->find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->users->findByEmail($email);
    }

    public function all(): Collection
    {
        return $this->users->all();
    }

    public function createWithDefaults(array $data): User
    {
        return $this->users->createWithDefaults($data);
    }

    public function update(string $id, array $data): bool
    {
        return $this->users->update($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->users->delete($id);
    }

    public function incrementPoints(string $userId, int $points): bool
    {
        return $this->users->incrementPoints($userId, $points);
    }

    public function touchLastAccess(string $userId): bool
    {
        return $this->users->touchLastAccess($userId);
    }
}
