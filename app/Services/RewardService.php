<?php

namespace App\Services;

use App\Models\Reward;
use App\Repositories\Contracts\RewardRepositoryInterface;
use Illuminate\Support\Collection;

class RewardService
{
    public function __construct(private readonly RewardRepositoryInterface $rewards) {}

    public function findByUser(string $userId): Collection
    {
        return $this->rewards->findByUser($userId);
    }

    public function create(string $userId, array $data): Reward
    {
        return $this->rewards->create(['user_id' => $userId] + $data);
    }
}
