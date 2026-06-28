<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Counts in Database:\n";
echo "Pharmacies: " . \App\Models\Pharmacy::count() . "\n";
echo "Branches: " . \App\Models\Branch::count() . "\n";
echo "Categories: " . \App\Models\Category::count() . "\n";
echo "Companies: " . \App\Models\Company::count() . "\n";
echo "Units: " . \App\Models\Unit::count() . "\n";
echo "Medicines: " . \App\Models\Medicine::count() . "\n";

foreach (\App\Models\Pharmacy::all() as $p) {
    echo "Pharmacy ID: {$p->id} | Name: {$p->name} has " . \App\Models\Medicine::where('pharmacy_id', $p->id)->count() . " medicines\n";
}
