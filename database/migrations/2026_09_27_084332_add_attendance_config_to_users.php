<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('attendance_qr_ttl')->default(5);
            $table->string('attendance_qr_ttl_unit')->default('minutes');
            $table->boolean('attendance_close_on_rescan')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['attendance_qr_ttl','attendance_qr_ttl_unit','attendance_close_on_rescan']);
        });
    }
};
