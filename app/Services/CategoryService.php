<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Support\Collection;

class CategoryService
{
    public function __construct(private readonly CategoryRepositoryInterface $categories) {}

    public function findByUser(string $userId): Collection
    {
        return $this->categories->findByUser($userId);
    }

    public function findByIdAndUser(string $id, string $userId): ?Category
    {
        return $this->categories->findByIdAndUser($id, $userId);
    }

    public function create(string $userId, array $data): Category
    {
        return $this->categories->create(['user_id' => $userId] + $data);
    }

    public function update(string $id, string $userId, array $data): bool
    {
        return $this->categories->update($id, $userId, $data);
    }

    public function delete(string $id, string $userId): bool
    {
        return $this->categories->delete($id, $userId);
    }
}
