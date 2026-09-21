<?php

namespace App\Http\Concerns;

use App\Models\Activity;
use App\Models\Category;
use App\Models\Reward;
use App\Models\Suggestion;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Support\Str;

trait SerializesDomain
{
    /**
     * Usuario público (todo salvo password_hash), claves en camelCase.
     *
     * @return array<string, mixed>
     */
    private function publicUser(User $user): array
    {
        $payload = [];

        foreach (array_keys($user->getAttributes()) as $column) {
            if ($column === 'password_hash') {
                continue;
            }

            $payload[Str::camel($column)] = $this->dateValue($user->getAttribute($column));
        }

        return $payload;
    }

    /**
     * @return array{id: string, userId: string, name: string, color: string, pointsPerHour: int}
     */
    private function categoryPayload(Category $category): array
    {
        return [
            'id' => $category->id,
            'userId' => $category->user_id,
            'name' => $category->name,
            'color' => $category->color,
            'pointsPerHour' => $category->points_per_hour,
        ];
    }

    /**
     * @return array{id: string, userId: string, title: string, cost: int, description: ?string, redeemedAt: ?string}
     */
    private function rewardPayload(Reward $reward): array
    {
        return [
            'id' => $reward->id,
            'userId' => $reward->user_id,
            'title' => $reward->title,
            'cost' => $reward->cost,
            'description' => $reward->description,
            'redeemedAt' => $this->dateValue($reward->redeemed_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function activityPayload(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'userId' => $activity->user_id,
            'categoryId' => $activity->category_id,
            'title' => $activity->title,
            'description' => $activity->description,
            'date' => $this->dateValue($activity->date),
            'startAt' => $this->dateValue($activity->start_at),
            'endAt' => $this->dateValue($activity->end_at),
            'status' => $activity->status,
            'points' => $activity->points,
            'isFree' => $activity->is_free,
            'completedAt' => $this->dateValue($activity->completed_at),
            'createdAt' => $this->dateValue($activity->created_at),
            'updatedAt' => $this->dateValue($activity->updated_at),
            'category' => $activity->relationLoaded('category') && $activity->category !== null
                ? $this->categoryPayload($activity->category)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function suggestionPayload(Suggestion $suggestion): array
    {
        return [
            'id' => $suggestion->id,
            'userId' => $suggestion->user_id,
            'generationId' => $suggestion->generation_id,
            'title' => $suggestion->title,
            'category' => $suggestion->category,
            'duration' => $suggestion->duration,
            'reason' => $suggestion->reason,
            'points' => $suggestion->points,
            'suggestedTime' => $suggestion->suggested_time,
            'source' => $suggestion->source,
            'createdAt' => $this->dateValue($suggestion->created_at),
        ];
    }

    private function dateValue(mixed $value): mixed
    {
        if ($value instanceof DateTimeInterface) {
            return $value->toIso8601String();
        }

        return $value;
    }
}
