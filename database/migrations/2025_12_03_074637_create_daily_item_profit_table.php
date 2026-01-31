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
        Schema::create('daily_item_profit', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->decimal('quantity_sold', 15, 2)->default(0);
            $table->decimal('revenue', 15, 2)->default(0);
            $table->decimal('cogs', 15, 2)->default(0); // Cost of Goods Sold
            $table->decimal('profit', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['date', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_item_profit');
    }
};
