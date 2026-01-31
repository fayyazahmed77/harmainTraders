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
        Schema::create('firms', function (Blueprint $table) {
            $table->id();

            // Basic info
            $table->string('name');
            $table->string('code')->unique();
            $table->date('date')->nullable(); // better as DATE, not string
            $table->string('business')->nullable();

            // Addresses
            $table->string('address1')->nullable();
            $table->string('address2')->nullable();
            $table->string('address3')->nullable();

            // Contact info
            $table->string('phone')->nullable();
            $table->string('fax')->nullable();
            $table->string('owner')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();

            // Registration details
            $table->string('saletax')->nullable();
            $table->string('ntn')->nullable();

            // Settings
            $table->boolean('printinvoice')->default(false);
            $table->boolean('defult')->default(false); // probably means 'default'
            $table->boolean('status')->default(true);

            // Created by
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firms');
    }
};
