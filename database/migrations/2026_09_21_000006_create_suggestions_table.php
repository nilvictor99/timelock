<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suggestions', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->string('generation_id');
            $table->string('title');
            $table->string('category');
            $table->integer('duration');
            $table->text('reason');
            $table->integer('points');
            $table->string('suggested_time')->nullable();
            $table->string('source')->default('rule');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'generation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suggestions');
    }
};
