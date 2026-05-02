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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('subject');
            $table->text('content'); // Markdown content
            $table->json('variables')->nullable(); // Metadata about available variables
            $table->timestamps();
        });

        // Seed with the Welcome Email
        DB::table('email_templates')->insert([
            'slug' => 'investor-welcome',
            'name' => 'Investor Welcome Email',
            'subject' => 'Welcome to Harmain Traders - Investor Portal Access',
            'content' => "# Welcome to Harmain Traders, {{name}}!\n\nWe are pleased to inform you that your Investor Portal account has been successfully created. You can now track your investments, monitor profits, and manage financial requests directly from our secure platform.\n\n### Your Access Credentials\nTo access your dashboard, please use the following credentials:\n\n<x-mail::panel>\n**Email:** {{email}}  \n**Password:** {{password}}\n</x-mail::panel>\n\n<x-mail::button :url=\"{{login_url}}\" color=\"success\">\nAccess Investor Dashboard\n</x-mail::button>\n\n### What you can do in the portal:\n*   **Real-time Ledger:** View your investment history and rolling balance.\n*   **Profit Tracking:** Monitor monthly profit distributions.\n*   **Quick Requests:** Submit withdrawal or reinvestment requests with one click.\n*   **Financial Reports:** Download audit-ready statements.\n\n*Important: For security reasons, we recommend changing your password after your first login.*\n\nIf you have any questions or require assistance, please do not hesitate to contact our support team.\n\nRegards,  \n**Harmain Traders Management**",
            'variables' => json_encode(['name', 'email', 'password', 'login_url']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
