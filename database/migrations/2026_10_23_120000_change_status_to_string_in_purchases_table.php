<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE purchases MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'Completed'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE purchases MODIFY COLUMN status ENUM('Completed', 'Partial Return', 'Returned', '') NOT NULL DEFAULT 'Completed'");
    }
};
