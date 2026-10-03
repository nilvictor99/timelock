<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Collection;

class UserRepository implements UserRepositoryInterface
{
    public function find(string $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function all(): Collection
    {
        return User::all();
    }

    public function createWithDefaults(array $data): User
    {
        $user = User::create(array_merge([
            'name' => 'Mi espacio',
            'timezone' => 'UTC',
            'operation_mode' => 'SYNCHRONOUS',
            'theme' => 'SYSTEM',
            'language' => 'es',
            'time_format' => '24',
            'measurement_unit' => 'METRIC',
            'notification_frequency' => 'ALL',
            'profile_visibility' => 'PRIVATE',
        ], $data));

        return $user->refresh();
    }

    public function update(string $id, array $data): bool
    {
        $user = $this->find($id);
        if (! $user) {
            return false;
        }

        return $user->update($data);
    }

    public function delete(string $id): bool
    {
        $user = $this->find($id);
        if (! $user) {
            return false;
        }

        return (bool) $user->delete();
    }

    public function incrementPoints(string $userId, int $points): bool
    {
        return (bool) User::whereKey($userId)->increment('points', $points);
    }

    public function decrementPoints(string $userId, int $points): bool
    {
        return (bool) User::whereKey($userId)->decrement('points', $points);
    }

    public function touchLastAccess(string $userId): bool
    {
        return (bool) User::whereKey($userId)->update(['last_access_at' => now()]);
    }
}
