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
        Schema::create('offer_lists', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('offer_id'); // FK to price_offer_to
            $table->foreignId('item_id')->constrained('items');
            $table->unsignedInteger('pack_ctn')->default(0);
            $table->unsignedInteger('loos_ctn')->default(0);
            $table->enum('price_type', ['trade', 'retail', 'wholesale', 'special']);
            $table->decimal('mrp', 10, 2)->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('scheme', 10, 2)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
      }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offer_lists');
    }
};
