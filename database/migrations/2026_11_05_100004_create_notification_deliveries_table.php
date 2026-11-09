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
        Schema::create('notification_deliveries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_user_id')->nullable();
            $table->unsignedBigInteger('online_order_id')->nullable();
            $table->string('event_key', 100);
            $table->enum('channel', ['database', 'email', 'whatsapp']);
            $table->string('recipient', 255);
            $table->string('message_reference', 255)->nullable();
            $table->enum('delivery_status', ['pending', 'queued', 'sent', 'delivered', 'failed', 'skipped'])->default('pending');
            $table->string('provider_reference', 255)->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->foreign('customer_user_id')->references('id')->on('customer_users')->onDelete('set null');
            $table->foreign('online_order_id')->references('id')->on('online_orders')->onDelete('set null');

            $table->index('online_order_id');
            $table->index(['channel', 'delivery_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
    }
};

