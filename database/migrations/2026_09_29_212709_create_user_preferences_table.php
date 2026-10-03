<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->string('user_id', 36)->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->json('preferred_activity_types')->nullable();
            $table->string('preferred_duration')->nullable();
            $table->json('preferred_times_of_day')->nullable();
            $table->string('solo_group_preference')->nullable();
            $table->string('energy_level')->nullable();
            $table->string('indoor_outdoor_preference')->nullable();
            $table->string('activity_budget')->nullable();
            $table->time('work_study_start')->nullable();
            $table->time('work_study_end')->nullable();
            $table->json('free_days')->nullable();
            $table->integer('work_hours')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
