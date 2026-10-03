<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->string('user_id', 36)->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->date('birth_date')->nullable();
            $table->string('gender_identity')->nullable();
            $table->string('fitness_level')->nullable();
            $table->text('physical_limitations')->nullable();
            $table->string('exercise_intensity')->nullable();
            $table->json('skills_with_experience')->nullable();
            $table->json('hobbies')->nullable();
            $table->json('sports')->nullable();
            $table->json('creative_activities')->nullable();
            $table->json('learning_interests')->nullable();
            $table->string('occupation')->nullable();
            $table->text('bio')->nullable();
            $table->text('interests')->nullable();
            $table->text('goals')->nullable();
            $table->integer('daily_available_minutes')->nullable();
            $table->json('resources_access')->nullable();
            $table->text('main_goals')->nullable();
            $table->text('short_term_goals')->nullable();
            $table->string('motivation_level')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
