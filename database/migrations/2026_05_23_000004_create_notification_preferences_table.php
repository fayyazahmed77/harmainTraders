<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Category this preference applies to (e.g., 'workflow', 'security', 'inventory')
            $table->string('category', 50);

            // Which channels are enabled for this category: ["database", "email", "broadcast", "sms"]
            $table->json('channels')->default('["database","broadcast"]');

            // Allow users to fully mute a category without removing their preferences
            $table->boolean('is_muted')->default(false);

            // Digests: null = immediate, 'hourly' | 'daily' | 'weekly'
            $table->enum('digest_frequency', ['immediate', 'hourly', 'daily', 'weekly'])
                  ->default('immediate');

            $table->timestamps();

            // One preference record per user per category
            $table->unique(['user_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
