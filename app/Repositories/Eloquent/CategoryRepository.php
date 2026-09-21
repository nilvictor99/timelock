<?php

namespace App\Repositories\Eloquent;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Support\Collection;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function findByUser(string $userId): Collection
    {
        return Category::where('user_id', $userId)->orderBy('name')->get();
    }

    public function findByIdAndUser(string $id, string $userId): ?Category
    {
        return Category::whereKey($id)->where('user_id', $userId)->first();
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(string $id, string $userId, array $data): bool
    {
        return (bool) Category::whereKey($id)->where('user_id', $userId)->update($data);
    }

    public function delete(string $id, string $userId): bool
    {
        return (bool) Category::whereKey($id)->where('user_id', $userId)->delete();
    }
}
