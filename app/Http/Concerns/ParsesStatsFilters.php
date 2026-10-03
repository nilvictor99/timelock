<?php

namespace App\Http\Concerns;

use DateTimeImmutable;
use DateTimeZone;

trait ParsesStatsFilters
{
    private const MAX_FILTERS = 100;

    /**
     * Rango estricto: exige from y to válidos y ordenados.
     *
     * @return array{0: DateTimeImmutable, 1: DateTimeImmutable}|null
     */
    private function parseRange(mixed $from, mixed $to): ?array
    {
        if (! $this->isDateString($from) || ! $this->isDateString($to)) {
            return null;
        }

        $fromDate = new DateTimeImmutable($from.'T00:00:00.000Z', new DateTimeZone('UTC'));
        $toDate = new DateTimeImmutable($to.'T23:59:59.999Z', new DateTimeZone('UTC'));

        return $fromDate <= $toDate ? [$fromDate, $toDate] : null;
    }

    /**
     * Rango opcional: sin from/to devuelve null,null (volcado completo).
     *
     * @return array{0: ?DateTimeImmutable, 1: ?DateTimeImmutable}|null
     */
    private function parseOptionalRange(mixed $from, mixed $to): ?array
    {
        if ($from !== null && ! $this->isDateString($from)) {
            return null;
        }

        if ($to !== null && ! $this->isDateString($to)) {
            return null;
        }

        $fromDate = $from !== null ? new DateTimeImmutable($from.'T00:00:00.000Z', new DateTimeZone('UTC')) : null;
        $toDate = $to !== null ? new DateTimeImmutable($to.'T23:59:59.999Z', new DateTimeZone('UTC')) : null;

        if ($fromDate === false || $toDate === false) {
            return null;
        }

        return [$fromDate, $toDate];
    }

    private function isDateString(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        try {
            return (new DateTimeImmutable($value, new DateTimeZone('UTC')))->format('Y-m-d') === $value;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array<int, string>|null
     */
    private function csvIds(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (! is_string($value) || $value === '') {
            return [];
        }

        $ids = array_values(array_unique(array_filter(array_map('trim', explode(',', $value)), fn ($id) => $id !== '')));

        return array_slice($ids, 0, self::MAX_FILTERS);
    }
}
