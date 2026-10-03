<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->string('user_id', 36)->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->boolean('notifications_enabled')->nullable();
            $table->json('notification_types')->nullable();
            $table->string('notification_frequency')->nullable();
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->boolean('voice_enabled')->nullable();
            $table->integer('notify_volume')->nullable();
            $table->string('notification_voice')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
