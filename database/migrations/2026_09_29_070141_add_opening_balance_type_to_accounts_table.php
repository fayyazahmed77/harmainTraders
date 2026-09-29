<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Add opening_balance_type column after opening_balance
            $table->enum('opening_balance_type', ['DR', 'CR'])
                  ->default('DR')
                  ->after('opening_balance');
        });

        // Data migration: infer DR/CR from existing data
        // Rule:
        //   - Accounts with purchase=1 (Suppliers) → positive OB means CR (owed to supplier)
        //   - Accounts with purchase=0 (Customers/Others) → positive OB means DR
        //   - Negative OB on any account → flip the sign and set opposite type

        // Handle negative opening balances (stored as negatives before this migration)
        // For suppliers (purchase=1): negative OB = DR (advance paid)
        DB::statement("
            UPDATE accounts
            SET opening_balance_type = 'DR',
                opening_balance = ABS(opening_balance)
            WHERE purchase = 1 AND opening_balance < 0
        ");

        // For customers/others (purchase=0): negative OB = CR (advance received)
        DB::statement("
            UPDATE accounts
            SET opening_balance_type = 'CR',
                opening_balance = ABS(opening_balance)
            WHERE (purchase = 0 OR purchase IS NULL) AND opening_balance < 0
        ");

        // Positive OB on suppliers = CR (normal supplier balance - owed to supplier)
        DB::statement("
            UPDATE accounts
            SET opening_balance_type = 'CR'
            WHERE purchase = 1 AND opening_balance >= 0
        ");

        // Positive OB on others (customers, cash, bank, etc.) = DR (default already set by column default)
        // No change needed — default 'DR' covers this case
    }

    public function down(): void
    {
        // Before dropping, convert back: CR type → negative value for backward compat
        DB::statement("
            UPDATE accounts
            SET opening_balance = opening_balance * -1
            WHERE opening_balance_type = 'CR' AND purchase = 0
        ");
        DB::statement("
            UPDATE accounts
            SET opening_balance = opening_balance * -1
            WHERE opening_balance_type = 'DR' AND purchase = 1
        ");

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('opening_balance_type');
        });
    }
};
