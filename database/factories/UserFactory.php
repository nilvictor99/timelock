<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Reward;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Password used by the factory, in plain text. Hashing it once keeps
     * `migrate:fresh --seed` fast even with the 12 bcrypt rounds the app uses.
     */
    protected static ?string $password;

    /**
     * The users table is not Laravel's default one: authentication lives in
     * `password_hash` (bcrypt) and there is no `email_verified_at` nor
     * `remember_token`. Defaults mirror UserRepository::createWithDefaults().
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => static::$password ??= Hash::make('password'),
            'timezone' => config('app.timezone', 'UTC'),
            'operation_mode' => 'SYNCHRONOUS',
            'theme' => 'SYSTEM',
            'language' => 'es',
            'time_format' => '24',
            'measurement_unit' => 'METRIC',
            'notification_frequency' => 'ALL',
            'profile_visibility' => 'PRIVATE',
        ];
    }

    /**
     * A user that has finished the onboarding wizard, so /dashboard is reachable.
     */
    public function onboarded(): static
    {
        return $this->state(fn (array $attributes) => [
            'onboarding_completed' => true,
        ]);
    }

    /**
     * The same default categories and rewards a real registration creates,
     * so seeded data behaves like data coming from AuthService::register().
     */
    public function withDefaults(): static
    {
        return $this->afterCreating(function (User $user): void {
            foreach (AuthService::DEFAULT_CATEGORIES as $category) {
                Category::create([
                    'user_id' => $user->id,
                    'name' => $category['name'],
                    'color' => $category['color'],
                    'points_per_hour' => $category['pointsPerHour'],
                ]);
            }

            foreach (AuthService::DEFAULT_REWARDS as $reward) {
                Reward::create([
                    'user_id' => $user->id,
                    'title' => $reward['title'],
                    'cost' => $reward['cost'],
                ]);
            }
        });
    }

    /**
     * One activity per day for the last $days, so stats, calendar and streaks
     * have something to render. Every day but today is already completed, and
     * `points`, `current_streak` and `best_streak` are set from what it
     * creates, overriding any value passed to create().
     */
    public function withHistory(int $days = 14): static
    {
        return $this->afterCreating(function (User $user) use ($days): void {
            $categories = Category::where('user_id', $user->id)->get();
            $completed = 0;
            $points = 0;

            for ($offset = $days - 1; $offset >= 0; $offset--) {
                $day = now()->subDays($offset);
                $start = $day->copy()->setTime(8, 0);
                $end = $day->copy()->setTime(9, 30);
                $category = $categories->isNotEmpty() ? $categories->random() : null;
                $earned = $category?->points_per_hour ?? 5;
                $isPast = $offset > 0;

                if ($isPast) {
                    $completed++;
                    $points += $earned;
                }

                $user->activities()->create([
                    'category_id' => $category?->id,
                    'title' => $category ? 'Sesión de '.$category->name : 'Sesión de mañana',
                    'date' => $day->format('Y-m-d'),
                    'start_at' => $start,
                    'end_at' => $end,
                    'status' => $isPast ? 'COMPLETED' : 'PLANNED',
                    'points' => $isPast ? $earned : 0,
                    'is_free' => false,
                    'completed_at' => $isPast ? $end : null,
                ]);
            }

            $user->forceFill([
                'points' => $points,
                'current_streak' => $completed,
                'best_streak' => $completed,
            ])->save();
        });
    }
}
