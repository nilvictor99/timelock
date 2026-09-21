<?php

namespace App\Repositories\Eloquent;

use App\Models\Activity;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Collection;

class ActivityRepository implements ActivityRepositoryInterface
{
    public function findByUser(string $userId): Collection
    {
        return Activity::with('category')
            ->where('user_id', $userId)
            ->orderBy('date')
            ->orderBy('start_at')
            ->get();
    }

    public function findByUserRange(string $userId, ?DateTimeInterface $from, ?DateTimeInterface $to): Collection
    {
        $query = Activity::with('category')->where('user_id', $userId);

        if ($from !== null) {
            $query->where('start_at', '>=', $from);
        }
        if ($to !== null) {
            $query->where('start_at', '<=', $to);
        }

        return $query->orderBy('date')->orderBy('start_at')->get();
    }

    public function findRecent(string $userId, DateTimeInterface $from, DateTimeInterface $to, int $limit): Collection
    {
        return Activity::with('category')
            ->where('user_id', $userId)
            ->whereBetween('start_at', [$from, $to])
            ->limit($limit)
            ->get();
    }

    public function findByPlannedAfter(string $userId, DateTimeInterface $after): Collection
    {
        return Activity::where('user_id', $userId)
            ->where('start_at', '>', $after)
            ->where('status', 'PLANNED')
            ->get();
    }

    public function findByIdAndUser(string $id, string $userId): ?Activity
    {
        return Activity::with('category')->whereKey($id)->where('user_id', $userId)->first();
    }

    public function create(array $data): Activity
    {
        return Activity::create($data);
    }

    public function update(string $id, string $userId, array $data): bool
    {
        $activity = $this->findByIdAndUser($id, $userId);
        if (! $activity) {
            return false;
        }

        return $activity->update($data);
    }

    public function updateTimes(string $id, string $userId, DateTimeInterface $date, DateTimeInterface $startAt, DateTimeInterface $endAt): bool
    {
        $activity = $this->findByIdAndUser($id, $userId);
        if (! $activity) {
            return false;
        }

        return $activity->update([
            'date' => $date,
            'start_at' => $startAt,
            'end_at' => $endAt,
        ]);
    }

    public function deleteByIdAndUser(string $id, string $userId): bool
    {
        return (bool) Activity::whereKey($id)->where('user_id', $userId)->delete();
    }
}
