<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface SuggestionRepositoryInterface
{
    public function createMany(array $rows): int;

    public function findByGeneration(string $userId, string $generationId): Collection;

    public function findRecent(string $userId, int $limit = 5): Collection;
}
