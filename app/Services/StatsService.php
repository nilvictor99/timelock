<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\User;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use DateTimeInterface;
use Illuminate\Support\Collection;

class StatsService
{
    private const HISTORY_LIMIT = 370;

    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
        private readonly CategoryRepositoryInterface $categories,
        private readonly RewardRepositoryInterface $rewards,
    ) {}

    /**
     * @param array<int, string>|null $activityIds
     * @param array<int, string>|null $categoryIds
     *
     * @return array<string, mixed>
     */
    public function summary(
        string $userId,
        User $user,
        DateTimeInterface $from,
        DateTimeInterface $to,
        ?array $activityIds = null,
        ?array $categoryIds = null,
    ): array {
        $rows = $this->activities->findByUserRange($userId, $from, $to);

        $rows = $rows->filter(function (Activity $activity) use ($activityIds, $categoryIds) {
            if ($activityIds !== null && $activityIds !== [] && ! in_array($activity->id, $activityIds, true)) {
                return false;
            }
            if ($categoryIds !== null && $categoryIds !== [] && ! in_array($activity->category_id, $categoryIds, true)) {
                return false;
            }

            return true;
        })->values();

        $redeemed = $this->rewards->findByUserRedeemedBetween($userId, $from, $to);

        return [
            'kpis' => $this->kpis($rows, $redeemed),
            'category' => $this->byCategory($rows),
            'daily' => $this->daily($rows),
            'topActivities' => $this->topActivities($rows),
            'weekday' => $this->weekday($rows),
            'streak' => $this->streak($rows, $user, $from, $to),
            'rewardTrend' => $this->rewardTrend($redeemed, $from, $to),
            'rewards' => $redeemed->map(fn ($reward) => [
                'id' => $reward->id,
                'title' => $reward->title,
                'cost' => $reward->cost,
                'redeemedAt' => $reward->redeemed_at?->toIso8601String(),
            ])->values()->all(),
            'options' => [
                'activities' => $this->activities->findByUser($userId)
                    ->map(fn (Activity $activity) => ['id' => $activity->id, 'title' => $activity->title])
                    ->unique(fn (array $option) => $option['id'])
                    ->values()
                    ->all(),
                'categories' => $this->categories->findByUser($userId)
                    ->map(fn ($category) => ['id' => $category->id, 'name' => $category->name, 'color' => $category->color])
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @param  Collection<int, Activity>  $rows
     * @param  Collection<int, \App\Models\Reward>  $redeemed
     *
     * @return array<string, int>
     */
    private function kpis(Collection $rows, Collection $redeemed): array
    {
        $completed = $rows->filter(fn (Activity $activity) => $activity->status === 'COMPLETED');

        return [
            'totalMinutes' => (int) $rows->sum(fn (Activity $activity) => $this->minutes($activity)),
            'completed' => $completed->count(),
            'points' => (int) $completed->sum(fn (Activity $activity) => $activity->points),
            'rewardsRedeemed' => $redeemed->count(),
            'pointsSpent' => (int) $redeemed->sum(fn ($reward) => $reward->cost),
        ];
    }

    /**
     * @param  Collection<int, Activity>  $rows
     *
     * @return array<int, array<string, int|string>>
     */
    private function byCategory(Collection $rows): array
    {
        $groups = [];

        foreach ($rows as $activity) {
            $key = $activity->category?->id ?? 'none';
            $name = $activity->category?->name ?? '—';
            $color = $activity->category?->color;
            $minutes = $this->minutes($activity);
            if ($minutes <= 0) {
                continue;
            }
            $groups[$key] ??= ['name' => $name, 'minutes' => 0, 'color' => $color];
            $groups[$key]['minutes'] += $minutes;
        }

        return collect(array_values($groups))->sortByDesc('minutes')->values()->all();
    }

    /**
     * @param  Collection<int, Activity>  $rows
     *
     * @return array<int, array<string, int|string>>
     */
    private function daily(Collection $rows): array
    {
        $groups = [];

        foreach ($rows as $activity) {
            $key = $activity->start_at?->format('Y-m-d');
            if ($key === null) {
                continue;
            }
            $groups[$key] ??= ['date' => $key, 'minutes' => 0, 'completed' => 0, 'total' => 0];
            $groups[$key]['minutes'] += $this->minutes($activity);
            $groups[$key]['total'] += 1;
            if ($activity->status === 'COMPLETED') {
                $groups[$key]['completed'] += 1;
            }
        }

        ksort($groups);

        return array_values($groups);
    }

    /**
     * @param  Collection<int, Activity>  $rows
     *
     * @return array<int, array<string, int|string>>
     */
    private function topActivities(Collection $rows): array
    {
        return $rows->countBy(fn (Activity $activity) => $activity->title)
            ->sortByDesc(fn (int $count) => $count)
            ->take(10)
            ->map(fn (int $count, string $name) => ['name' => $name, 'count' => $count])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Activity>  $rows
     *
     * @return array<int, array<string, int>>
     */
    private function weekday(Collection $rows): array
    {
        $days = [];
        for ($index = 0; $index <= 6; $index++) {
            $days[$index] = ['day' => $index, 'completed' => 0, 'total' => 0, 'compliance' => 0];
        }

        foreach ($rows as $activity) {
            $index = (int) $activity->start_at?->format('w');
            $days[$index]['total'] += 1;
            if ($activity->status === 'COMPLETED') {
                $days[$index]['completed'] += 1;
            }
        }

        foreach ($days as $index => $day) {
            $days[$index]['compliance'] = $day['total'] > 0
                ? (int) round(($day['completed'] / $day['total']) * 100)
                : 0;
        }

        return array_values($days);
    }

    /**
     * @param  Collection<int, Activity>  $rows
     *
     * @return array<string, mixed>
     */
    private function streak(Collection $rows, User $user, DateTimeInterface $from, DateTimeInterface $to): array
    {
        $daily = [];
        foreach ($rows as $activity) {
            $key = $activity->start_at?->format('Y-m-d');
            if ($key === null) {
                continue;
            }
            $daily[$key] ??= ['total' => 0, 'completed' => 0];
            $daily[$key]['total'] += 1;
            if ($activity->status === 'COMPLETED') {
                $daily[$key]['completed'] += 1;
            }
        }
        ksort($daily);

        $completedDates = array_keys(array_filter($daily, fn (array $day) => $day['completed'] > 0));

        $longest = 0;
        $run = 0;
        $previous = null;
        foreach ($completedDates as $date) {
            $timestamp = strtotime($date.' 00:00:00');
            if ($previous !== null && $timestamp - $previous === 86_400) {
                $run += 1;
            } else {
                $run = 1;
            }
            $longest = max($longest, $run);
            $previous = $timestamp;
        }

        $current = 0;
        $cursor = strtotime(date('Y-m-d 00:00:00'));
        while (in_array(date('Y-m-d', $cursor), $completedDates, true)) {
            $current += 1;
            $cursor = strtotime('-1 day', $cursor);
        }

        $perfectDays = count(array_filter($daily, fn (array $day) => $day['total'] > 0 && $day['completed'] === $day['total']));

        $history = [];
        $cursor = strtotime($from->format('Y-m-d 00:00:00'));
        $end = strtotime($to->format('Y-m-d 00:00:00'));
        while ($cursor <= $end && count($history) < self::HISTORY_LIMIT) {
            $key = date('Y-m-d', $cursor);
            $day = $daily[$key] ?? null;
            $history[] = [
                'date' => $key,
                'completed' => $day !== null && $day['total'] > 0 && $day['completed'] === $day['total'],
                'total' => $day['total'] ?? 0,
            ];
            $cursor = strtotime('+1 day', $cursor);
        }

        return [
            'current' => max($current, (int) $user->current_streak),
            'longest' => max($longest, (int) $user->best_streak),
            'perfectDays' => $perfectDays,
            'history' => $history,
        ];
    }

    /**
     * @param  Collection<int, \App\Models\Reward>  $redeemed
     *
     * @return array<int, array<string, int|string>>
     */
    private function rewardTrend(Collection $redeemed, DateTimeInterface $from, DateTimeInterface $to): array
    {
        $spanDays = ($to->getTimestamp() - $from->getTimestamp()) / 86_400;
        $monthly = $spanDays > 60;

        $groups = [];
        foreach ($redeemed as $reward) {
            if ($reward->redeemed_at === null) {
                continue;
            }
            $key = $monthly
                ? $reward->redeemed_at->format('Y-m-01')
                : $reward->redeemed_at->startOfWeek()->format('Y-m-d');
            $groups[$key] = ($groups[$key] ?? 0) + 1;
        }

        ksort($groups);

        return array_map(fn (string $date, int $count) => ['date' => $date, 'count' => $count], array_keys($groups), $groups);
    }

    private function minutes(Activity $activity): int
    {
        if ($activity->start_at === null || $activity->end_at === null) {
            return 0;
        }

        return (int) round(($activity->end_at->getTimestamp() - $activity->start_at->getTimestamp()) / 60);
    }
}
