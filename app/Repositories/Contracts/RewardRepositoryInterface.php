<?php

namespace App\Repositories\Contracts;

use App\Models\Reward;
use Illuminate\Support\Collection;

interface RewardRepositoryInterface
{
    public function findByUser(string $userId): Collection;

    public function create(array $data): Reward;
}
