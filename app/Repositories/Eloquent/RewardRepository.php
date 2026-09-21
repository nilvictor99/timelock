<?php

namespace App\Repositories\Eloquent;

use App\Models\Reward;
use App\Repositories\Contracts\RewardRepositoryInterface;
use Illuminate\Support\Collection;

class RewardRepository implements RewardRepositoryInterface
{
    public function findByUser(string $userId): Collection
    {
        return Reward::where('user_id', $userId)->orderBy('cost')->get();
    }

    public function create(array $data): Reward
    {
        return Reward::create($data);
    }
}
