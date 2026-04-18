<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Account;
use Illuminate\Support\Str;

$account = Account::where('id', '>', 0)->first();
if ($account) {
    if (!$account->guest_token) {
        $account->guest_token = (string) Str::uuid();
        $account->save();
    }
    echo "Account: " . $account->title . "\n";
    echo "Token: " . $account->guest_token . "\n";
    echo "URL: " . url("/g/" . $account->guest_token) . "\n";
} else {
    echo "No account found.\n";
}
