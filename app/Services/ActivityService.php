<?php

namespace App\Services;

use App\Models\Activity;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Collection;

class ActivityService
{
    public function __construct(private readonly ActivityRepositoryInterface $activities) {}

    public function findByUser(string $userId): Collection
    {
        return $this->activities->findByUser($userId);
    }

    public function findByUserRange(string $userId, ?DateTimeInterface $from = null, ?DateTimeInterface $to = null): Collection
    {
        return $this->activities->findByUserRange($userId, $from, $to);
    }

    public function findRecent(string $userId, DateTimeInterface $from, DateTimeInterface $to, int $limit = 10): Collection
    {
        return $this->activities->findRecent($userId, $from, $to, $limit);
    }

    public function findByPlannedAfter(string $userId, DateTimeInterface $after): Collection
    {
        return $this->activities->findByPlannedAfter($userId, $after);
    }

    public function findByIdAndUser(string $id, string $userId): ?Activity
    {
        return $this->activities->findByIdAndUser($id, $userId);
    }

    public function create(array $data): Activity
    {
        return $this->activities->create($data);
    }

    public function update(string $id, string $userId, array $data): bool
    {
        return $this->activities->update($id, $userId, $data);
    }

    public function updateTimes(string $id, string $userId, DateTimeInterface $date, DateTimeInterface $startAt, DateTimeInterface $endAt): bool
    {
        return $this->activities->updateTimes($id, $userId, $date, $startAt, $endAt);
    }

    public function deleteByIdAndUser(string $id, string $userId): bool
    {
        return $this->activities->deleteByIdAndUser($id, $userId);
    }
}
