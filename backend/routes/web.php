<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'PrimePharm ERP API',
        'version' => '1.0.0',
        'status' => 'running',
        'documentation' => '/api/v1',
    ]);
})->middleware('throttle:api_public');
