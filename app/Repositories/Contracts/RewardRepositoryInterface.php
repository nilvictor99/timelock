<?php

namespace App\Repositories\Contracts;

use App\Models\Reward;
use DateTimeInterface;
use Illuminate\Support\Collection;

interface RewardRepositoryInterface
{
    public function findByUser(string $userId): Collection;

    public function findByUserRedeemedBetween(string $userId, DateTimeInterface $from, DateTimeInterface $to): Collection;

    public function findByIdAndUser(string $id, string $userId): ?Reward;

    public function create(array $data): Reward;

    public function markRedeemed(string $id, string $userId): bool;
}
