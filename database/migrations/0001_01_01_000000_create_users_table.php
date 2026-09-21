<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Schema real de TimeLock-v (00001_initial_schema.sql), no el default de Laravel.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('name')->default('Mi espacio');
            $table->string('email')->unique()->nullable();
            $table->string('password_hash')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->string('timezone')->default('UTC');
            $table->string('operation_mode')->default('SYNCHRONOUS');
            $table->timestampTz('birth_date')->nullable();
            $table->string('gender_identity')->nullable();
            $table->string('fitness_level')->nullable();
            $table->string('physical_limitations')->nullable();
            $table->string('exercise_intensity')->nullable();
            $table->json('skills_with_experience')->nullable();
            $table->json('hobbies')->nullable();
            $table->json('sports')->nullable();
            $table->json('creative_activities')->nullable();
            $table->json('learning_interests')->nullable();
            $table->json('preferred_activity_types')->nullable();
            $table->string('preferred_duration')->nullable();
            $table->json('preferred_times_of_day')->nullable();
            $table->string('solo_group_preference')->nullable();
            $table->string('energy_level')->nullable();
            $table->string('indoor_outdoor_preference')->nullable();
            $table->string('activity_budget')->nullable();
            $table->string('work_study_start')->nullable();
            $table->string('work_study_end')->nullable();
            $table->json('free_days')->nullable();
            $table->string('occupation')->nullable();
            $table->text('bio')->nullable();
            $table->text('interests')->nullable();
            $table->text('goals')->nullable();
            $table->string('work_hours')->nullable();
            $table->integer('daily_available_minutes')->nullable();
            $table->json('resources_access')->nullable();
            $table->json('main_goals')->nullable();
            $table->text('short_term_goals')->nullable();
            $table->integer('motivation_level')->nullable();
            $table->string('theme')->default('SYSTEM');
            $table->string('language')->default('es');
            $table->string('timezone_override')->nullable();
            $table->string('time_format')->default('24');
            $table->string('measurement_unit')->default('METRIC');
            $table->boolean('notifications_enabled')->default(true);
            $table->json('notification_types')->nullable();
            $table->string('notification_frequency')->default('ALL');
            $table->string('quiet_hours_start')->nullable();
            $table->string('quiet_hours_end')->nullable();
            $table->boolean('voice_enabled')->default(false);
            $table->integer('notify_volume')->default(70);
            $table->string('notification_voice')->nullable();
            $table->integer('generation_personalization')->default(70);
            $table->boolean('avoid_recent_activities')->default(false);
            $table->integer('recent_activities_window')->default(7);
            $table->boolean('include_completed_history')->default(true);
            $table->string('profile_visibility')->default('PRIVATE');
            $table->string('ai_provider')->nullable();
            $table->string('ai_model')->nullable();
            $table->string('ai_base_url')->nullable();
            $table->float('ai_temperature')->default(0.7);
            $table->integer('ai_max_tokens')->default(500);
            $table->boolean('pause_active')->default(false);
            $table->string('pause_reason')->nullable();
            $table->timestampTz('pause_starts_at')->nullable();
            $table->timestampTz('pause_ends_at')->nullable();
            $table->integer('points')->default(0);
            $table->integer('current_streak')->default(0);
            $table->integer('best_streak')->default(0);
            $table->timestampTz('last_access_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
