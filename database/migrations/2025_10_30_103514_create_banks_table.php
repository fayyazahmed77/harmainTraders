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
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('account_no');      // ✅ fixed typo
            $table->string('account_name');    // ✅ fixed typo
            $table->string('code')->nullable();
            $table->string('branch')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();   // ✅ fixed typo
            $table->string('website')->nullable();
            $table->string('logo')->nullable();
            $table->unsignedBigInteger('created_by')->nullable(); // ✅ better type for relation with users table
            $table->timestamps();

            // ✅ optional: add foreign key for created_by
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
