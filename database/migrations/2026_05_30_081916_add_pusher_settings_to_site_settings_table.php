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
        Schema::table('site_settings', function (Blueprint $table) {
            $table->string('broadcast_driver')->default('reverb')->after('mail_from_name');
            $table->string('pusher_app_id')->nullable()->after('broadcast_driver');
            $table->string('pusher_app_key')->nullable()->after('pusher_app_id');
            $table->string('pusher_app_secret')->nullable()->after('pusher_app_key');
            $table->string('pusher_app_cluster')->nullable()->after('pusher_app_secret');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn([
                'broadcast_driver',
                'pusher_app_id',
                'pusher_app_key',
                'pusher_app_secret',
                'pusher_app_cluster',
            ]);
        });
    }
};
