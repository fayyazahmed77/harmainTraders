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
        DB::table('email_templates')->insert([
            'slug' => 'financial-request-status',
            'name' => 'Financial Request Status Update',
            'subject' => 'Financial Request Update - Harmain Traders',
            'content' => "# Hello {{name}},\n\nYour financial request has been reviewed by our administration team.\n\n<x-mail::panel>\n**Status:** {{status}}  \n**Request Type:** {{type}}  \n**Amount:** {{amount}}  \n**Requested On:** {{date}}\n</x-mail::panel>\n\n@if(\$note)\n**Admin Note:**  \n> {{note}}\n@endif\n\nYou can view the full details of your transaction history and current balance by logging into your investor dashboard.\n\n<x-mail::button :url=\"{{dashboard_url}}\" color=\"success\">\nGo to Dashboard\n</x-mail::button>",
            'variables' => json_encode(['name', 'status', 'type', 'amount', 'date', 'note', 'dashboard_url']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('email_templates')->where('slug', 'financial-request-status')->delete();
    }
};
