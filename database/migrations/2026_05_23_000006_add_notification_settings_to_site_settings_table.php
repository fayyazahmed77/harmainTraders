<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->json('notification_settings')->nullable()->after('mail_from_name');
        });

        // Set default notification settings on the first settings row
        $defaultSettings = [
            'workflow' => ['database', 'broadcast'],
            'security' => ['database', 'broadcast'],
            'sla' => ['database', 'broadcast'],
            'inventory' => ['database', 'broadcast'],
        ];

        DB::table('site_settings')->update([
            'notification_settings' => json_encode($defaultSettings)
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('notification_settings');
        });
    }
};
