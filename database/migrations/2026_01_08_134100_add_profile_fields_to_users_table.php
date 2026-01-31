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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('country')->nullable()->after('phone');
            $table->string('job_title')->nullable()->after('image');
            $table->string('department')->nullable()->after('job_title');
            $table->text('bio')->nullable()->after('department');
            $table->string('cover_image')->nullable()->after('bio');

            // Social Profiles
            $table->string('linkedin_url')->nullable()->after('cover_image');
            $table->string('facebook_url')->nullable()->after('linkedin_url');
            $table->string('instagram_url')->nullable()->after('facebook_url');
            $table->string('twitter_url')->nullable()->after('instagram_url');
            $table->string('portfolio_url')->nullable()->after('twitter_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'country',
                'job_title',
                'department',
                'bio',
                'cover_image',
                'linkedin_url',
                'facebook_url',
                'instagram_url',
                'twitter_url',
                'portfolio_url',
            ]);
        });
    }
};
