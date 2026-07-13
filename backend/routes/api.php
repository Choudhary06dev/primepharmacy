<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PharmacyController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\MedicineController;
use App\Http\Controllers\Api\V1\MedicineBatchController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\ExpenseCategoryController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\LedgerController;
use App\Http\Controllers\Api\V1\CustomerReturnController;
use App\Http\Controllers\Api\V1\SupplierReturnController;
use App\Http\Controllers\Api\V1\ReportController;

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

    // Public Guest Routes (Throttled for brute-force protection)
    Route::middleware('throttle:login')->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/register', [AuthController::class, 'register']);
    });

    // Global routes. These are not tenant-scoped.
    Route::middleware(['auth:sanctum', 'throttle:api_general'])->group(function () {
        Route::get('/pharmacies', [PharmacyController::class, 'index']);
        Route::post('/pharmacies', [PharmacyController::class, 'store']);
        Route::put('/pharmacies/{pharmacy}', [PharmacyController::class, 'update']);
        Route::delete('/pharmacies/{pharmacy}', [PharmacyController::class, 'destroy']);

        // Users & Roles APIs
        Route::apiResource('/users', UserController::class);
        Route::apiResource('/roles', RoleController::class);
        Route::post('/roles/{roleName}/permissions', [RoleController::class, 'updatePermissions']);
    });

    // Authenticated Tenant-Scoped & Subscription-Gated Routes
    Route::middleware(['auth:sanctum', 'tenant', 'subscription'])->group(function () {

        // Session & Profile (General Limit)
        Route::middleware('throttle:api_general')->group(function () {
            Route::post('/auth/logout', [AuthController::class, 'logout']);
            Route::get('/auth/me', [AuthController::class, 'me']);
        });

        // Dashboard Stats (Protected by reports limit due to database load)
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->middleware('throttle:api_reports');

        // Inventory Modules (General Limit)
        Route::prefix('inventory')->middleware('throttle:api_general')->group(function () {
            Route::apiResource('categories', CategoryController::class);
            Route::apiResource('companies', CompanyController::class);
            Route::apiResource('units', UnitController::class);
            Route::apiResource('medicines', MedicineController::class);
            Route::apiResource('batches', MedicineBatchController::class);
        });

        // POS & Invoicing
        Route::prefix('sales')->group(function () {
            // Highly resilient throttle for cashier checkout activity
            Route::post('/pos', [SaleController::class, 'store'])->middleware('throttle:api_pos');
            Route::apiResource('invoices', SaleController::class)->only(['index', 'show', 'store'])->middleware('throttle:api_general');
        });

        // General ERP Resources (General Limit)
        Route::middleware('throttle:api_general')->group(function () {
            Route::apiResource('customers', CustomerController::class);
            Route::apiResource('suppliers', SupplierController::class);
            Route::apiResource('returns/customer', CustomerReturnController::class)->only(['index', 'show', 'store']);
            Route::apiResource('returns/supplier', SupplierReturnController::class)->only(['index', 'show', 'store']);

            Route::prefix('purchases')->group(function () {
                Route::apiResource('orders', PurchaseController::class)->only(['index', 'show', 'store']);
            });

            Route::apiResource('expenses/categories', ExpenseCategoryController::class)->names('expenses.categories');
            Route::apiResource('expenses', ExpenseController::class);
        });

        // Financials & Heavy Calculation Reports (Tight Rate Limit)
        Route::prefix('financials')->middleware('throttle:api_reports')->group(function () {
            Route::get('/ledgers/supplier/{id}', [LedgerController::class, 'supplier']);
            Route::get('/ledgers/customer/{id}', [LedgerController::class, 'customer']);
            Route::get('/reports/summary', [ReportController::class, 'summary']);
        });
    });
});
