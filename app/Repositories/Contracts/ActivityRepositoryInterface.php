<?php

namespace App\Repositories\Contracts;

use App\Models\Activity;
use DateTimeInterface;
use Illuminate\Support\Collection;

interface ActivityRepositoryInterface
{
    public function findByUser(string $userId): Collection;

    public function findByUserRange(string $userId, ?DateTimeInterface $from, ?DateTimeInterface $to): Collection;

    public function findRecent(string $userId, DateTimeInterface $from, DateTimeInterface $to, int $limit): Collection;

    public function findByPlannedAfter(string $userId, DateTimeInterface $after): Collection;

    public function findByIdAndUser(string $id, string $userId): ?Activity;

    public function create(array $data): Activity;

    public function update(string $id, string $userId, array $data): bool;

    public function updateTimes(string $id, string $userId, DateTimeInterface $date, DateTimeInterface $startAt, DateTimeInterface $endAt): bool;

    public function deleteByIdAndUser(string $id, string $userId): bool;
}
