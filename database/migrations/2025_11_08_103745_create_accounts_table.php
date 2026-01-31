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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable();
            $table->string('title')->nullable();
            $table->string('type')->nullable(); // Stores AccountType ID or name string as per existing schema
            $table->boolean('purchase')->default(false);
            $table->boolean('cashbank')->default(false);
            $table->boolean('sale')->default(false);
            $table->boolean('status')->default(true);
            $table->decimal('opening_balance', 15, 2)->nullable();
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->integer('aging_days')->nullable();
            $table->string('note_head')->nullable();
            $table->string('address1')->nullable();
            $table->string('address2')->nullable();
            $table->string('telephone1')->nullable();
            $table->string('telephone2')->nullable();
            $table->string('fax')->nullable();
            $table->string('mobile')->nullable();
            $table->string('cnic')->nullable();
            $table->string('gst')->nullable();
            $table->string('ntn')->nullable();
            $table->string('ats_type')->nullable();
            $table->string('ats_percentage')->nullable();
            $table->text('remarks')->nullable();
            $table->string('regards')->nullable();
            $table->date('opening_date')->nullable();
            $table->date('fbr_date')->nullable();
            $table->foreignId('country_id')->nullable();
            $table->foreignId('province_id')->nullable();
            $table->foreignId('city_id')->nullable();
            $table->foreignId('area_id')->nullable();
            $table->foreignId('subarea_id')->nullable();
            $table->foreignId('saleman_id')->nullable();
            $table->foreignId('booker_id')->nullable();
            $table->foreignId('item_category')->nullable();
            $table->string('category')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
