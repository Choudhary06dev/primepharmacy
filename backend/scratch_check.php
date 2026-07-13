<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Starting performance check for Medicine::with(['category', 'company', 'baseUnit', 'conversions.fromUnit', 'batches'])->get();\n";
ini_set('memory_limit', '512M');
$start = microtime(true);
$meds = \App\Models\Medicine::with(['category', 'company', 'baseUnit', 'conversions.fromUnit', 'batches'])->get();
echo 'Time taken: ' . (microtime(true) - $start) . " seconds\n";
echo 'Fetched count: ' . $meds->count() . "\n";
echo 'Memory Peak Usage: ' . (memory_get_peak_usage(true) / 1024 / 1024) . " MB\n";
