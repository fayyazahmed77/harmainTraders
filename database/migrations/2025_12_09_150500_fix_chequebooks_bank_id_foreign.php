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
        Schema::table('chequebooks', function (Blueprint $table) {
            // Drop the incorrect foreign key referencing 'banks'
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign('chequebooks_bank_id_foreign');
            }

            // Add the correct foreign key referencing 'accounts'
            $table->foreign('bank_id')->references('id')->on('accounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chequebooks', function (Blueprint $table) {
            // Drop the correct foreign key
            $table->dropForeign(['bank_id']);

            // Restore the old incorrect one (referencing 'banks')
            // Note: This assumes 'banks' table exists.
            $table->foreign('bank_id')->references('id')->on('banks')->onDelete('cascade');
        });
    }
};
