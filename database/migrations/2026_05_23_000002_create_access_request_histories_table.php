<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_request_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('access_request_id');
            $table->foreign('access_request_id')
                  ->references('id')
                  ->on('access_requests')
                  ->cascadeOnDelete();

            // The admin/actor who performed the action (null = system auto-action)
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('previous_status', [
                'pending', 'more_info_requested', 'approved', 'rejected',
            ]);
            $table->enum('new_status', [
                'pending', 'more_info_requested', 'approved', 'rejected',
            ]);

            $table->unsignedTinyInteger('step_number')->default(1);
            $table->text('action_notes')->nullable(); // Required for rejections, optional for others

            // Security fingerprint of this action
            $table->string('ip_address', 45);
            $table->string('user_agent', 500);

            // Tamper-proof HMAC signature of this record's payload
            $table->string('signature', 256);

            // Immutable — no updated_at
            $table->timestamp('created_at')->useCurrent();

            $table->index(['access_request_id', 'step_number']);
            $table->index('actor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_request_histories');
    }
};
