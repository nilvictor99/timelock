<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('qr_login_tokens', function (Blueprint $table) {
            // null = the credential never expires, which makes it a standing
            // secret: the only safe companions are a bounded use count or an
            // explicit warning at creation time.
            $table->timestampTz('expires_at')->nullable()->change();
            $table->unsignedInteger('max_uses')->nullable()->after('expires_at');
            $table->unsignedInteger('uses_count')->default(0)->after('max_uses');
        });

        // A partial index beats the plain one: perpetual tokens are never the
        // target of a prune or a "is this still good" lookup, so keeping them out
        // leaves a much smaller index to scan.
        DB::statement('DROP INDEX IF EXISTS qr_login_tokens_expires_at_index');
        DB::statement('CREATE INDEX qr_login_tokens_expires_at_partial ON qr_login_tokens (expires_at) WHERE expires_at IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS qr_login_tokens_expires_at_partial');

        Schema::table('qr_login_tokens', function (Blueprint $table) {
            $table->dropColumn(['max_uses', 'uses_count']);
        });

        // Any token created as perpetual cannot be represented by the old schema.
        DB::statement('DELETE FROM qr_login_tokens WHERE expires_at IS NULL');
        DB::statement('ALTER TABLE qr_login_tokens ALTER COLUMN expires_at SET NOT NULL');
        DB::statement('CREATE INDEX qr_login_tokens_expires_at_index ON qr_login_tokens (expires_at)');
    }
};
