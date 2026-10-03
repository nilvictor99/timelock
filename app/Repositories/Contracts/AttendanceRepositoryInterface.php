<?php

namespace App\Repositories\Contracts;

use App\Models\Attendance;
use DateTimeInterface;
use Illuminate\Support\Collection;

interface AttendanceRepositoryInterface
{
    public function findByUser(string $userId): Collection;
    public function findByUserRange(string $userId, ?DateTimeInterface $from, ?DateTimeInterface $to): Collection;
    public function findOpenByUserAndType(string $userId, string $type, string $date): ?Attendance;
    public function create(array $data): Attendance;
    public function update(string $id, string $userId, array $data): bool;
}
