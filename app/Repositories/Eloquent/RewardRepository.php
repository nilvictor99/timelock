<?php

namespace App\Repositories\Eloquent;

use App\Models\Reward;
use App\Repositories\Contracts\RewardRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Collection;

class RewardRepository implements RewardRepositoryInterface
{
    public function findByUser(string $userId): Collection
    {
        return Reward::where('user_id', $userId)->orderBy('cost')->get();
    }

    public function findByUserRedeemedBetween(string $userId, DateTimeInterface $from, DateTimeInterface $to): Collection
    {
        return Reward::where('user_id', $userId)
            ->where('redeemed_at', '>=', $from->format('Y-m-d').' 00:00:00')
            ->where('redeemed_at', '<=', $to->format('Y-m-d').' 23:59:59')
            ->orderBy('redeemed_at')
            ->get();
    }

    public function findByIdAndUser(string $id, string $userId): ?Reward
    {
        return Reward::whereKey($id)->where('user_id', $userId)->first();
    }

    public function create(array $data): Reward
    {
        return Reward::create($data);
    }

    public function markRedeemed(string $id, string $userId): bool
    {
        return (bool) Reward::whereKey($id)->where('user_id', $userId)->update(['redeemed_at' => now()]);
    }
}
