<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$zainab = User::where('name', 'like', '%Zainab%')->first();
if ($zainab) {
    echo "User: {$zainab->name}\n";
    echo "  Email: {$zainab->email}\n";
    echo "  Pharmacy ID: " . ($zainab->pharmacy_id ?? 'NULL') . "\n";
    echo "  Branch ID: " . ($zainab->branch_id ?? 'NULL') . "\n";
    if ($zainab->branch) {
        echo "  Branch Name: '{$zainab->branch->name}', Main: " . ($zainab->branch->is_main ? 'YES' : 'NO') . "\n";
    }
} else {
    echo "Zainab Fatima not found.\n";
}
