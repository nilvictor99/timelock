<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_qr_tokens', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->string('type');
            $table->string('token_hash')->unique();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('used_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id','type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_qr_tokens');
    }
};
