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
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Country Name
            $table->string('code', 5)->unique(); // ISO Code e.g. PK, US
            $table->string('phone_code', 10)->nullable(); // +92, +1
            $table->string('flag_url')->nullable(); // Image URL or file path
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 10)->nullable(); // user id who created
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
