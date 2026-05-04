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
        Schema::table('profit_distributions', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('status');
            $table->timestamp('locked_at')->nullable()->after('is_locked');
            $table->foreignId('locked_by')->nullable()->constrained('users')->after('locked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profit_distributions', function (Blueprint $table) {
            $table->dropForeign(['locked_by']);
            $table->dropColumn(['is_locked', 'locked_at', 'locked_by']);
        });
    }
};
