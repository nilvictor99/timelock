<?php

namespace App\Services;

use App\Models\Attendance;
use App\Repositories\Contracts\AttendanceRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    public function __construct(private readonly AttendanceRepositoryInterface $repo) {}

    public function toggle(string $userId, string $type): Attendance
    {
        $date = Carbon::now()->format('Y-m-d');
        $open = $this->repo->findOpenByUserAndType($userId, $type, $date);
        if ($open) {
            $endedAt = Carbon::now();
            $duration = $open->started_at->diffInMinutes($endedAt);
            $this->repo->update($open->id, $userId, [
                'ended_at' => $endedAt,
                'duration_minutes' => $duration,
            ]);
            $open->refresh();
            return $open;
        }
        return $this->repo->create([
            'user_id' => $userId,
            'type' => $type,
            'started_at' => Carbon::now(),
        ]);
    }

    public function listByRange(string $userId, ?DateTimeInterface $from, ?DateTimeInterface $to): Collection
    {
        return $this->repo->findByUserRange($userId, $from, $to);
    }

    public function summary(string $userId, DateTimeInterface $from, DateTimeInterface $to): array
    {
        $rows = $this->repo->findByUserRange($userId, $from, $to);
        $work = $rows->where('type','WORK')->sum('duration_minutes');
        $break = $rows->where('type','BREAK')->sum('duration_minutes');
        return [
            'work_minutes' => (int)$work,
            'break_minutes' => (int)$break,
            'sessions' => $rows->count(),
        ];
    }
}
