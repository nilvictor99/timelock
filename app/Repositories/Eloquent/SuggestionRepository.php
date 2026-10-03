<?php

namespace App\Repositories\Eloquent;

use App\Models\Suggestion;
use App\Repositories\Contracts\SuggestionRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SuggestionRepository implements SuggestionRepositoryInterface
{
    public function createMany(array $rows): int
    {
        if (empty($rows)) {
            return 0;
        }

        $rows = array_map(static fn (array $row) => array_merge(['id' => (string) Str::uuid()], $row), $rows);

        return Suggestion::insert($rows) ? count($rows) : 0;
    }

    public function findByGeneration(string $userId, string $generationId): Collection
    {
        return Suggestion::where('user_id', $userId)
            ->where('generation_id', $generationId)
            ->get();
    }

    public function findRecent(string $userId, int $limit = 5): Collection
    {
        return Suggestion::where('user_id', $userId)
            ->latest('created_at')
            ->limit($limit)
            ->get();
    }
}
