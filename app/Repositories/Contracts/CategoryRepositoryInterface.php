<?php

namespace App\Repositories\Contracts;

use App\Models\Category;
use Illuminate\Support\Collection;

interface CategoryRepositoryInterface
{
    public function findByUser(string $userId): Collection;

    public function findByIdAndUser(string $id, string $userId): ?Category;

    public function create(array $data): Category;

    public function update(string $id, string $userId, array $data): bool;

    public function delete(string $id, string $userId): bool;
}
