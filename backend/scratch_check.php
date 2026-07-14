<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

ini_set('memory_limit', '512M');

echo "Test 1: Medicine::all() (no relationships)\n";
$start = microtime(true);
$meds = \App\Models\Medicine::all();
echo 'Time taken: ' . (microtime(true) - $start) . " seconds\n";
echo 'Fetched count: ' . $meds->count() . "\n";
echo 'Memory Peak Usage: ' . (memory_get_peak_usage(true) / 1024 / 1024) . " MB\n\n";

echo "Test 2: Medicine::select('id', 'name', 'sku', 'barcode')->get() (only names and IDs)\n";
$start = microtime(true);
$meds2 = \App\Models\Medicine::select('id', 'name', 'sku', 'barcode')->get();
echo 'Time taken: ' . (microtime(true) - $start) . " seconds\n";
echo 'Memory Peak Usage: ' . (memory_get_peak_usage(true) / 1024 / 1024) . " MB\n\n";
