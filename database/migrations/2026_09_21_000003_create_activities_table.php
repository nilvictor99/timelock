<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->string('category_id', 36)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestampTz('date');
            $table->timestampTz('start_at');
            $table->timestampTz('end_at');
            $table->string('status')->default('PLANNED');
            $table->integer('points')->default(0);
            $table->boolean('is_free')->default(false);
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'start_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
