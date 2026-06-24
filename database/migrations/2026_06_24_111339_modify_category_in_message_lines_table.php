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
        // Migrate existing data first to ensure it's valid JSON
        foreach (\DB::table('message_lines')->get() as $row) {
            if ($row->category) {
                $data = json_decode($row->category, true);
                if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                    $newCategory = json_encode([$row->category]);
                    \DB::table('message_lines')
                        ->where('id', $row->id)
                        ->update(['category' => $newCategory]);
                }
            }
        }

        Schema::table('message_lines', function (Blueprint $table) {
            $table->json('category')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('message_lines', function (Blueprint $table) {
            $table->string('category')->nullable()->change();
        });
    }
};
