<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Requester
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // What is being requested
            $table->string('resource_type', 100); // e.g., 'procurement.invoices', 'inventory.approval'
            $table->string('action_type', 50);     // e.g., 'create', 'approve', 'view-sensitive'
            $table->text('justification');

            // Workflow state
            $table->enum('status', [
                'pending',
                'more_info_requested',
                'approved',
                'rejected',
            ])->default('pending')->index();

            $table->unsignedTinyInteger('current_step')->default(1);
            $table->timestamp('sla_due_at')->nullable();

            // Security fingerprint
            $table->string('ip_address', 45);
            $table->string('user_agent', 500);

            // Extra metadata (browser, OS, geo-hint, device type)
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Composite indexes for common query patterns
            $table->index(['user_id', 'status']);
            $table->index(['resource_type', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_requests');
    }
};
