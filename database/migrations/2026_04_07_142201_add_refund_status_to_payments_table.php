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
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN cheque_status ENUM('Pending', 'Clear', 'Canceled', 'Returned', 'In Hand', 'Distributed', 'Refund') DEFAULT 'Pending' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN cheque_status ENUM('Pending', 'Clear', 'Canceled', 'Returned', 'In Hand', 'Distributed', 'Refund') DEFAULT 'Pending' NOT NULL");
    }
};
