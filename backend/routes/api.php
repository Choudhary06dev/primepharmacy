<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PharmacyController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\MedicineController;
use App\Http\Controllers\Api\V1\MedicineBatchController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\CustomerController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider or bootstrap/app.php.
|
*/

Route::prefix('v1')->group(function () {

    // Public Guest Routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Global routes. These are not tenant-scoped.
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/pharmacies', [PharmacyController::class, 'index']);
        Route::post('/pharmacies', [PharmacyController::class, 'store']);
        Route::put('/pharmacies/{pharmacy}', [PharmacyController::class, 'update']);
        Route::delete('/pharmacies/{pharmacy}', [PharmacyController::class, 'destroy']);
    });

    // Authenticated Tenant-Scoped & Subscription-Gated Routes
    Route::middleware(['auth:sanctum', 'tenant', 'subscription'])->group(function () {

        // Session & Profile
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Future Module Placeholders (Stubs to outline structure)
        Route::prefix('inventory')->group(function () {
            Route::apiResource('categories', CategoryController::class);
            Route::apiResource('companies', CompanyController::class);
            Route::apiResource('units', UnitController::class);
            Route::apiResource('medicines', MedicineController::class);
            Route::apiResource('batches', MedicineBatchController::class);
        });

        Route::prefix('sales')->group(function () {
            Route::post('/pos', [SaleController::class, 'store']);
            Route::apiResource('invoices', SaleController::class)->only(['index', 'show', 'store']);
        });

        Route::apiResource('customers', CustomerController::class)->only(['index', 'store']);

        Route::prefix('purchases')->group(function () {
            // Route::apiResource('orders', PurchaseController::class);
        });

        Route::prefix('financials')->group(function () {
            // Route::apiResource('expenses', ExpenseController::class);
            // Route::get('/ledgers/supplier/{id}', [LedgerController::class, 'supplier']);
            // Route::get('/ledgers/customer/{id}', [LedgerController::class, 'customer']);
        });
    });
});
