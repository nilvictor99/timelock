<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->orderBy('id')->chunkById(200, function ($users) {
            foreach ($users as $user) {
                DB::table('user_profiles')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'birth_date' => $user->birth_date,
                        'gender_identity' => $user->gender_identity,
                        'fitness_level' => $user->fitness_level,
                        'physical_limitations' => $user->physical_limitations,
                        'exercise_intensity' => $user->exercise_intensity,
                        'skills_with_experience' => $user->skills_with_experience,
                        'hobbies' => $user->hobbies,
                        'sports' => $user->sports,
                        'creative_activities' => $user->creative_activities,
                        'learning_interests' => $user->learning_interests,
                        'occupation' => $user->occupation,
                        'bio' => $user->bio,
                        'interests' => $user->interests,
                        'goals' => $user->goals,
                        'daily_available_minutes' => $user->daily_available_minutes,
                        'resources_access' => $user->resources_access,
                        'main_goals' => $user->main_goals,
                        'short_term_goals' => $user->short_term_goals,
                        'motivation_level' => $user->motivation_level,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                DB::table('user_preferences')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'preferred_activity_types' => $user->preferred_activity_types,
                        'preferred_duration' => $user->preferred_duration,
                        'preferred_times_of_day' => $user->preferred_times_of_day,
                        'solo_group_preference' => $user->solo_group_preference,
                        'energy_level' => $user->energy_level,
                        'indoor_outdoor_preference' => $user->indoor_outdoor_preference,
                        'activity_budget' => $user->activity_budget,
                        'work_study_start' => $user->work_study_start,
                        'work_study_end' => $user->work_study_end,
                        'free_days' => $user->free_days,
                        'work_hours' => $user->work_hours,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                DB::table('user_settings')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'theme' => $user->theme,
                        'language' => $user->language,
                        'timezone_override' => $user->timezone_override,
                        'time_format' => $user->time_format,
                        'measurement_unit' => $user->measurement_unit,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                DB::table('user_notifications')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'notifications_enabled' => $user->notifications_enabled,
                        'notification_types' => $user->notification_types,
                        'notification_frequency' => $user->notification_frequency,
                        'quiet_hours_start' => $user->quiet_hours_start,
                        'quiet_hours_end' => $user->quiet_hours_end,
                        'voice_enabled' => $user->voice_enabled,
                        'notify_volume' => $user->notify_volume,
                        'notification_voice' => $user->notification_voice,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                DB::table('user_ai_settings')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'ai_provider' => $user->ai_provider,
                        'ai_model' => $user->ai_model,
                        'ai_base_url' => $user->ai_base_url,
                        'ai_temperature' => $user->ai_temperature,
                        'ai_max_tokens' => $user->ai_max_tokens,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                DB::table('user_pauses')->updateOrInsert(
                    ['user_id' => $user->id],
                    [
                        'pause_active' => $user->pause_active,
                        'pause_reason' => $user->pause_reason,
                        'pause_starts_at' => $user->pause_starts_at,
                        'pause_ends_at' => $user->pause_ends_at,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        });
    }

    public function down(): void
    {
        // No reverse data migration for safety
    }
};
