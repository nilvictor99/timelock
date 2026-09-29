<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['attendance_qr_ttl', 'attendance_qr_ttl_unit', 'attendance_close_on_rescan']);
        });

        Schema::dropIfExists('attendance_qr_tokens');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('attendance_qr_ttl')->default(5);
            $table->string('attendance_qr_ttl_unit')->default('minutes');
            $table->boolean('attendance_close_on_rescan')->default(true);
        });

        Schema::create('attendance_qr_tokens', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->string('type');
            $table->string('token_hash');
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('used_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });
    }
};
