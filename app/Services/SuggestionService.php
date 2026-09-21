<?php

namespace App\Services;

use App\Repositories\Contracts\SuggestionRepositoryInterface;
use Illuminate\Support\Collection;

class SuggestionService
{
    public function __construct(private readonly SuggestionRepositoryInterface $suggestions) {}

    public function createMany(array $rows): int
    {
        return $this->suggestions->createMany($rows);
    }

    public function findByGeneration(string $userId, string $generationId): Collection
    {
        return $this->suggestions->findByGeneration($userId, $generationId);
    }

    public function findRecent(string $userId, int $limit = 5): Collection
    {
        return $this->suggestions->findRecent($userId, $limit);
    }
}
