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
        Schema::create('online_order_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_order_id');
            $table->string('action', 100);
            $table->string('previous_status', 50)->nullable();
            $table->string('new_status', 50)->nullable();
            $table->string('actor_type', 100);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->text('description')->nullable();
            $table->text('reason')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('online_order_id')->references('id')->on('online_orders')->onDelete('cascade');
            $table->index(['online_order_id', 'created_at']);
        });

        Schema::create('online_order_revisions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_order_id');
            $table->unsignedInteger('revision_number');
            $table->enum('revision_status', ['draft', 'awaiting_customer_acceptance', 'accepted', 'rejected', 'superseded'])->default('draft');
            $table->decimal('proposed_subtotal', 15, 2);
            $table->enum('proposed_discount_type', ['none', 'fixed', 'percentage'])->default('none');
            $table->decimal('proposed_discount_rate', 15, 2)->default(0.00);
            $table->decimal('proposed_discount_amount', 15, 2)->default(0.00);
            $table->decimal('proposed_delivery_charges', 15, 2)->default(0.00);
            $table->decimal('proposed_final_total', 15, 2);
            $table->text('change_reason');
            $table->unsignedBigInteger('created_by');
            $table->timestamp('submitted_to_customer_at')->nullable();
            $table->timestamp('customer_accepted_at')->nullable();
            $table->timestamp('customer_rejected_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('online_order_id')->references('id')->on('online_orders')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');

            $table->index(['online_order_id', 'revision_number']);
        });

        Schema::create('online_order_revision_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('revision_id');
            $table->unsignedBigInteger('product_id');
            $table->string('item_code_snapshot', 100)->nullable();
            $table->string('item_name_snapshot', 255);
            $table->string('unit_snapshot', 50)->nullable();
            $table->decimal('qty_carton', 12, 2)->default(0.00);
            $table->decimal('qty_pcs', 12, 2)->default(0.00);
            $table->decimal('total_pcs', 12, 2)->default(0.00);
            $table->decimal('price_carton', 15, 2)->default(0.00);
            $table->decimal('price_piece', 15, 2)->default(0.00);
            $table->decimal('line_subtotal', 15, 2)->default(0.00);
            $table->string('change_reason', 255)->nullable();
            $table->timestamps();

            $table->foreign('revision_id')->references('id')->on('online_order_revisions')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('items')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_order_revision_items');
        Schema::dropIfExists('online_order_revisions');
        Schema::dropIfExists('online_order_histories');
    }
};

