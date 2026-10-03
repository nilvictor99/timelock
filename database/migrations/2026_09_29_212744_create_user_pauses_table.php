<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_pauses', function (Blueprint $table) {
            $table->string('user_id', 36)->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->boolean('pause_active')->default(false);
            $table->string('pause_reason')->nullable();
            $table->timestamp('pause_starts_at')->nullable();
            $table->timestamp('pause_ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_pauses');
    }
};
