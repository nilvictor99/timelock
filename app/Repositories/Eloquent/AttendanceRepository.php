<?php

namespace App\Repositories\Eloquent;

use App\Models\Attendance;
use App\Repositories\Contracts\AttendanceRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Collection;

class AttendanceRepository implements AttendanceRepositoryInterface
{
    public function __construct(private readonly Attendance $model) {}

    public function findByUser(string $userId): Collection
    {
        return $this->model->where('user_id', $userId)->latest('started_at')->get();
    }

    public function findByUserRange(string $userId, ?DateTimeInterface $from, ?DateTimeInterface $to): Collection
    {
        $q = $this->model->where('user_id', $userId);
        if ($from) $q->where('started_at', '>=', $from);
        if ($to) $q->where('started_at', '<=', $to);
        return $q->latest('started_at')->get();
    }

    public function findOpenByUserAndType(string $userId, string $type, string $date): ?Attendance
    {
        return $this->model->where('user_id', $userId)
            ->where('type', $type)
            ->whereDate('started_at', $date)
            ->whereNull('ended_at')
            ->first();
    }

    public function create(array $data): Attendance
    {
        return $this->model->create($data);
    }

    public function update(string $id, string $userId, array $data): bool
    {
        $attendance = $this->model->where('id', $id)->where('user_id', $userId)->first();
        if (!$attendance) return false;
        $attendance->update($data);
        return true;
    }
}
