<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'email', 'password_hash', 'avatar_url', 'country', 'city',
    'onboarding_completed', 'timezone', 'operation_mode', 'birth_date',
    'gender_identity', 'fitness_level', 'physical_limitations', 'exercise_intensity',
    'skills_with_experience', 'hobbies', 'sports', 'creative_activities',
    'learning_interests', 'preferred_activity_types', 'preferred_duration',
    'preferred_times_of_day', 'solo_group_preference', 'energy_level',
    'indoor_outdoor_preference', 'activity_budget', 'work_study_start',
    'work_study_end', 'free_days', 'occupation', 'bio', 'interests', 'goals',
    'work_hours', 'daily_available_minutes', 'resources_access', 'main_goals',
    'short_term_goals', 'motivation_level', 'theme', 'language', 'timezone_override',
    'time_format', 'measurement_unit', 'notifications_enabled', 'notification_types',
    'notification_frequency', 'quiet_hours_start', 'quiet_hours_end', 'voice_enabled',
    'notify_volume', 'notification_voice', 'generation_personalization',
    'avoid_recent_activities', 'recent_activities_window', 'include_completed_history',
    'profile_visibility', 'ai_provider', 'ai_model', 'ai_base_url', 'ai_temperature',
    'ai_max_tokens', 'pause_active', 'pause_reason', 'pause_starts_at', 'pause_ends_at',
    'points', 'current_streak', 'best_streak', 'last_access_at',
])]
#[Hidden(['password_hash'])]
class User extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'onboarding_completed' => 'boolean',
            'skills_with_experience' => 'array',
            'hobbies' => 'array',
            'sports' => 'array',
            'creative_activities' => 'array',
            'learning_interests' => 'array',
            'preferred_activity_types' => 'array',
            'preferred_times_of_day' => 'array',
            'free_days' => 'array',
            'resources_access' => 'array',
            'main_goals' => 'array',
            'interests' => 'array',
            'notification_types' => 'array',
            'notifications_enabled' => 'boolean',
            'voice_enabled' => 'boolean',
            'avoid_recent_activities' => 'boolean',
            'include_completed_history' => 'boolean',
            'pause_active' => 'boolean',
            'birth_date' => 'datetime',
            'pause_starts_at' => 'datetime',
            'pause_ends_at' => 'datetime',
            'last_access_at' => 'datetime',
        ];
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function qrLoginTokens(): HasMany
    {
        return $this->hasMany(QrLoginToken::class);
    }

    public function suggestions(): HasMany
    {
        return $this->hasMany(Suggestion::class);
    }
}
