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
        Schema::create('audit_ledgers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Actor who performed the action (null = system/anonymous)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            
            $table->string('action', 100); // e.g., 'access_request.approved'
            
            // Polymorphic target (supports both string UUID and integer IDs)
            $table->string('auditable_type', 255);
            $table->string('auditable_id', 36);
            
            $table->json('old_state')->nullable();
            $table->json('new_state')->nullable();
            
            $table->string('ip_address', 45);
            $table->string('user_agent', 500);
            
            // Chained cryptographic SHA-256 signature
            $table->char('checksum', 64);
            
            // Immutable — no updated_at
            $table->timestamp('created_at')->useCurrent();
            
            // Composite & standard indexes for performance
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_ledgers');
    }
};
