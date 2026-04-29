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
        // 1. investors table
        Schema::create('investors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->string('cnic');
            $table->text('address')->nullable();
            $table->date('joining_date');
            $table->enum('status', ['active', 'suspended', 'exited'])->default('active');
            $table->timestamps();
        });

        // 2. investor_capital_accounts table
        Schema::create('investor_capital_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained()->onDelete('cascade');
            $table->decimal('current_capital', 15, 2)->default(0);
            $table->decimal('initial_capital', 15, 2)->default(0);
            $table->decimal('ownership_percentage', 5, 2)->default(0);
            $table->timestamp('last_recalculated_at')->nullable();
            $table->timestamps();
        });

        // 3. capital_history table
        Schema::create('capital_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained()->onDelete('cascade');
            $table->enum('event_type', ['initial_investment', 'reinvestment', 'withdrawal', 'adjustment']);
            $table->decimal('amount', 15, 2);
            $table->decimal('capital_before', 15, 2);
            $table->decimal('capital_after', 15, 2);
            $table->decimal('ownership_before', 5, 2);
            $table->decimal('ownership_after', 5, 2);
            $table->decimal('total_capital_before', 15, 2);
            $table->decimal('total_capital_after', 15, 2);
            $table->date('effective_date');
            $table->string('effective_from_period')->nullable(); // YYYY-MM
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // 4. profit_distributions table
        Schema::create('profit_distributions', function (Blueprint $table) {
            $table->id();
            $table->string('distribution_period'); // YYYY-MM
            $table->decimal('total_business_profit', 15, 2);
            $table->decimal('total_business_capital', 15, 2);
            $table->timestamp('distributed_at')->nullable();
            $table->foreignId('distributed_by')->constrained('users');
            $table->enum('status', ['draft', 'distributed', 'reversed'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. investor_profit_shares table
        Schema::create('investor_profit_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distribution_id')->constrained('profit_distributions')->onDelete('cascade');
            $table->foreignId('investor_id')->constrained()->onDelete('cascade');
            $table->decimal('capital_snapshot', 15, 2);
            $table->decimal('ownership_snapshot', 5, 2);
            $table->decimal('profit_amount', 15, 2);
            $table->enum('status', ['pending', 'credited', 'withdrawn', 'reinvested'])->default('pending');
            $table->timestamp('credited_at')->nullable();
            $table->timestamps();
        });

        // 6. investor_transactions table
        Schema::create('investor_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['profit_credit', 'reinvestment', 'withdrawal', 'capital_in', 'capital_out', 'adjustment']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->text('narration')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // 7. financial_requests table
        Schema::create('financial_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained()->onDelete('cascade');
            $table->enum('request_type', ['reinvestment', 'profit_withdrawal', 'capital_withdrawal']);
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'paid'])->default('pending');
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->text('admin_note')->nullable();
            $table->text('investor_note')->nullable();
            $table->date('effective_date')->nullable();
            $table->date('deferred_until')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // 8. approval_logs table
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('financial_requests')->onDelete('cascade');
            $table->enum('action', ['submitted', 'approved', 'rejected', 'cancelled', 'paid']);
            $table->foreignId('performed_by')->constrained('users');
            $table->timestamp('performed_at')->useCurrent();
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('note')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_logs');
        Schema::dropIfExists('financial_requests');
        Schema::dropIfExists('investor_transactions');
        Schema::dropIfExists('investor_profit_shares');
        Schema::dropIfExists('profit_distributions');
        Schema::dropIfExists('capital_history');
        Schema::dropIfExists('investor_capital_accounts');
        Schema::dropIfExists('investors');
    }
};
