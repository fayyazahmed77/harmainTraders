<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            
            // Branding
            $table->string('company_name')->default('Harmain Traders');
            $table->string('logo_path')->nullable();
            
            // Contact Info
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('address')->nullable();
            
            // Social Media
            $table->string('facebook_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('instagram_url')->nullable();

            // SMTP Settings
            $table->string('mail_host')->nullable();
            $table->string('mail_port')->nullable();
            $table->string('mail_username')->nullable();
            $table->string('mail_password')->nullable();
            $table->string('mail_encryption')->nullable();
            $table->string('mail_from_address')->nullable();
            $table->string('mail_from_name')->nullable();

            $table->timestamps();
        });

        // Seed initial data
        DB::table('site_settings')->insert([
            'company_name' => 'Harmain Traders',
            'contact_email' => 'support@harmaintraders.com',
            'contact_phone' => '+92 300 1234567',
            'address' => 'Main Market, City Center, Pakistan',
            'facebook_url' => 'https://facebook.com/harmaintraders',
            'linkedin_url' => 'https://linkedin.com/company/harmaintraders',
            'mail_from_name' => 'Harmain Traders',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
