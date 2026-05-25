<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only create if the default Laravel notifications table doesn't already exist
        // This replaces the default notifications table with our extended version
        if (Schema::hasTable('notifications')) {
            // Add missing columns to existing notifications table
            Schema::table('notifications', function (Blueprint $table) {
                if (! Schema::hasColumn('notifications', 'priority')) {
                    $table->enum('priority', ['low', 'medium', 'high', 'critical'])
                          ->default('medium')
                          ->after('data');
                }
                if (! Schema::hasColumn('notifications', 'category')) {
                    $table->string('category', 50)->default('general')->after('priority');
                }
                if (! Schema::hasColumn('notifications', 'group_key')) {
                    $table->string('group_key', 100)->nullable()->after('category');
                }
                if (! Schema::hasColumn('notifications', 'expires_at')) {
                    $table->timestamp('expires_at')->nullable()->after('read_at');
                }
            });
        } else {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');                              // FQCN of Notification class
                $table->morphs('notifiable');                        // notifiable_type + notifiable_id
                $table->json('data');                                // Payload: title, message, actionUrl, etc.
                $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->string('category', 50)->default('general'); // e.g., 'workflow', 'security', 'inventory'
                $table->string('group_key', 100)->nullable();        // For grouping (e.g., 'stock_alert_wh1')
                $table->timestamp('read_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('created_at')->useCurrent();

                // Perf-critical composite index: drives bell count & unread list queries
                $table->index(['notifiable_type', 'notifiable_id', 'read_at'], 'notifications_notifiable_read_idx');
                $table->index(['category', 'priority']);
                $table->index('group_key');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                // Only drop the columns we added; don't destroy the whole table
                $columns = ['priority', 'category', 'group_key', 'expires_at'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('notifications', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
