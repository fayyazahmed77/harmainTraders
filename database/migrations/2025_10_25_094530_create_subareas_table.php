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
        Schema::create('subareas', function (Blueprint $table) {
            $table->id();
            $table->integer('country_id');
            $table->integer('provience_id');
            $table->integer('city_id');
            $table->integer('area_id');
            $table->string('name');
            $table->string('status');
            $table->integer('created_by');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subareas');
    }
};
