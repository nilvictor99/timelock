<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_ai_settings', function (Blueprint $table) {
            $table->string('user_id', 36)->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('ai_provider')->nullable();
            $table->string('ai_model')->nullable();
            $table->string('ai_base_url')->nullable();
            $table->float('ai_temperature')->nullable();
            $table->integer('ai_max_tokens')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_ai_settings');
    }
};
