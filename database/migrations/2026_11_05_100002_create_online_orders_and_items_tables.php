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
        Schema::create('online_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique();
            $table->unsignedBigInteger('customer_user_id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('offer_id')->nullable();
            $table->enum('status', ['pending', 'under_review', 'awaiting_customer_acceptance', 'confirmed', 'canceled'])->default('pending');
            $table->decimal('original_subtotal', 15, 2)->default(0.00);
            $table->decimal('current_subtotal', 15, 2)->default(0.00);
            $table->enum('discount_type', ['none', 'fixed', 'percentage'])->default('none');
            $table->decimal('discount_rate', 15, 2)->default(0.00);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->decimal('delivery_charges', 15, 2)->default(0.00);
            $table->decimal('final_total', 15, 2)->default(0.00);
            $table->string('currency', 10)->default('PKR');
            $table->unsignedBigInteger('sale_id')->nullable()->unique();
            $table->text('cancellation_reason')->nullable();
            $table->text('internal_notes')->nullable();
            $table->text('customer_notes')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('canceled_by')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->string('idempotency_key', 64)->nullable();
            $table->unsignedInteger('revision_number')->default(1);
            $table->timestamp('customer_accepted_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_user_id')->references('id')->on('customer_users')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
            $table->foreign('offer_id')->references('id')->on('price_offer_to')->onDelete('set null');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('set null');
            $table->foreign('confirmed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('canceled_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['status', 'submitted_at']);
            $table->index('idempotency_key');
        });

        Schema::create('online_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_order_id');
            $table->unsignedBigInteger('offer_item_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->string('item_code_snapshot', 100)->nullable();
            $table->string('item_name_snapshot', 255);
            $table->string('unit_snapshot', 50)->nullable();
            $table->decimal('packing_qty_snapshot', 10, 2)->default(1.00);
            $table->decimal('qty_carton', 12, 2)->default(0.00);
            $table->decimal('qty_pcs', 12, 2)->default(0.00);
            $table->decimal('total_pcs', 12, 2)->default(0.00);
            $table->decimal('price_carton', 15, 2)->default(0.00);
            $table->decimal('price_piece', 15, 2)->default(0.00);
            $table->decimal('line_subtotal', 15, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('online_order_id')->references('id')->on('online_orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('items')->onDelete('restrict');

            $table->index(['online_order_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_order_items');
        Schema::dropIfExists('online_orders');
    }
};

