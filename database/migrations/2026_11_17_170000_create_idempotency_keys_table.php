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
        if (!Schema::hasTable('idempotency_keys')) {
            Schema::create('idempotency_keys', function (Blueprint $table) {
                $table->id();
                $table->string('key', 64)->unique();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('route_name', 120)->index();
                $table->char('request_hash', 64);
                $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
                $table->string('target_type', 100)->nullable();
                $table->unsignedBigInteger('target_id')->nullable();
                $table->longText('response_payload')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'route_name']);
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
