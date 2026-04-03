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
        // Safe modification of ENUM to add 'In Hand' and 'Distributed' properties for Cheque-in-Hand logic
        DB::statement("ALTER TABLE payments MODIFY COLUMN cheque_status ENUM('Pending', 'Clear', 'Canceled', 'Returned', 'In Hand', 'Distributed') DEFAULT 'Pending' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN cheque_status ENUM('Pending', 'Clear', 'Canceled', 'Returned', 'In Hand', 'Distributed') DEFAULT 'Pending' NOT NULL");
    }
};
