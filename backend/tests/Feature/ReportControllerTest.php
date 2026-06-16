<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Pharmacy;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemBatch;
use App\Models\Subscription;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_returns_correct_financial_analytics(): void
    {
        // 1. Create a Pharmacy and Subscription Plan
        $plan = Plan::create([
            'name' => 'Basic',
            'slug' => 'basic',
            'price' => 2000,
            'billing_cycle' => 'monthly',
            'features' => json_encode(['pos', 'inventory']),
        ]);

        $pharmacy = Pharmacy::create([
            'name' => 'Test Pharmacy',
            'slug' => 'test-pharmacy',
            'status' => 'active',
            'plan' => 'Basic',
        ]);

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'payment_status' => 'paid',
        ]);

        $branch = Branch::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Main Branch',
            'is_main' => true,
        ]);

        $user = User::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        // Bind tenant id for our test records setup
        app()->instance('tenant.id', $pharmacy->id);

        // 2. Create helper entities
        $category = Category::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Analgesic',
        ]);

        $company = Company::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'GSK',
        ]);

        $unit = Unit::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Tablet',
            'abbreviation' => 'tab',
        ]);

        $medicine = Medicine::create([
            'pharmacy_id' => $pharmacy->id,
            'category_id' => $category->id,
            'company_id' => $company->id,
            'name' => 'Panadol Active',
            'generic_name' => 'Paracetamol',
            'min_stock_level' => 10,
            'base_unit_id' => $unit->id,
        ]);

        $supplier = Supplier::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Test Supplier',
        ]);

        $customer = Customer::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Test Customer',
        ]);

        // 3. Create stock batches
        $batch1 = MedicineBatch::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'medicine_id' => $medicine->id,
            'batch_no' => 'BAT-001',
            'expiry_date' => now()->addYears(2),
            'quantity' => 100,
            'remaining_quantity' => 80, // 20 units sold
            'purchase_price' => 10.00,
            'sale_price' => 15.00,
            'status' => 'ACTIVE',
        ]);

        // 4. Create sale checkout records
        $sale = Sale::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_no' => 'INV-2026-0001',
            'sale_date' => now()->toDateString(),
            'sub_total' => 300.00,
            'tax' => 0.00,
            'discount' => 0.00,
            'grand_total' => 300.00,
            'paid_amount' => 300.00,
            'payment_status' => 'PAID',
            'payment_method' => 'CASH',
        ]);

        $saleItem = SaleItem::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_id' => $sale->id,
            'medicine_id' => $medicine->id,
            'unit_id' => $unit->id,
            'quantity' => 20,
            'unit_price' => 15.00,
            'conversion_factor' => 1.0,
            'base_quantity' => 20,
            'base_price' => 15.00,
        ]);

        SaleItemBatch::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_item_id' => $saleItem->id,
            'batch_id' => $batch1->id,
            'quantity' => 20,
        ]);

        // 5. Create an operating expense
        $expenseCat = ExpenseCategory::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Utilities',
        ]);

        Expense::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'expense_category_id' => $expenseCat->id,
            'amount' => 50.00,
            'expense_date' => now()->toDateString(),
            'description' => 'May electricity bill',
        ]);

        // 6. Request the reports controller summary endpoint
        Sanctum::actingAs($user);

        // Remove our manual tenant binding to let request flow handle it
        app()->offsetUnset('tenant.id');

        $response = $this->getJson('/api/v1/financials/reports/summary');

        // 7. Validate response and exact calculations
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'summary' => [
                'total_sales',
                'total_expenses',
                'total_cogs',
                'gross_profit',
                'net_profit',
            ],
            'monthly_trend',
            'expense_breakdown',
            'top_medicines',
            'inventory_valuation' => [
                'cost_value',
                'retail_value',
                'margin',
            ],
        ]);

        // Assert exact computed values
        $data = $response->json();

        // Total Sales = 300.00
        $this->assertEquals(300.00, $data['summary']['total_sales']);
        // Total Expenses = 50.00
        $this->assertEquals(50.00, $data['summary']['total_expenses']);
        // COGS = 20 units * 10.00 purchase_price = 200.00
        $this->assertEquals(200.00, $data['summary']['total_cogs']);
        // Gross Profit = 300 - 200 = 100.00
        $this->assertEquals(100.00, $data['summary']['gross_profit']);
        // Net Profit = 100 - 50 = 50.00
        $this->assertEquals(50.00, $data['summary']['net_profit']);

        // Inventory Valuation
        // Remaining Qty = 80, Purchase Price = 10.00 -> Cost Value = 800.00
        $this->assertEquals(800.00, $data['inventory_valuation']['cost_value']);
        // Remaining Qty = 80, Sale Price = 15.00 -> Retail Value = 1200.00
        $this->assertEquals(1200.00, $data['inventory_valuation']['retail_value']);
        // Margin = 1200 - 800 = 400.00
        $this->assertEquals(400.00, $data['inventory_valuation']['margin']);

        // Top Selling Medicines
        $this->assertCount(1, $data['top_medicines']);
        $this->assertEquals('Panadol Active', $data['top_medicines'][0]['name']);
        $this->assertEquals(20, $data['top_medicines'][0]['quantity_sold']);
        $this->assertEquals(300.00, $data['top_medicines'][0]['revenue']);

        // Expense Breakdown
        $this->assertCount(1, $data['expense_breakdown']);
        $this->assertEquals('Utilities', $data['expense_breakdown'][0]['name']);
        $this->assertEquals(50.00, $data['expense_breakdown'][0]['value']);
    }

    public function test_summary_filters_by_date_range(): void
    {
        $plan = Plan::create([
            'name' => 'Basic',
            'slug' => 'basic',
            'price' => 2000,
            'billing_cycle' => 'monthly',
            'features' => json_encode(['pos', 'inventory']),
        ]);

        $pharmacy = Pharmacy::create([
            'name' => 'Test Pharmacy',
            'slug' => 'test-pharmacy',
            'status' => 'active',
            'plan' => 'Basic',
        ]);

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'payment_status' => 'paid',
        ]);

        $branch = Branch::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Main Branch',
            'is_main' => true,
        ]);

        $user = User::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        // Bind tenant id
        app()->instance('tenant.id', $pharmacy->id);

        $category = Category::create(['pharmacy_id' => $pharmacy->id, 'name' => 'Analgesic']);
        $company = Company::create(['pharmacy_id' => $pharmacy->id, 'name' => 'GSK']);
        $unit = Unit::create(['pharmacy_id' => $pharmacy->id, 'name' => 'Tablet', 'abbreviation' => 'tab']);
        $medicine = Medicine::create([
            'pharmacy_id' => $pharmacy->id,
            'category_id' => $category->id,
            'company_id' => $company->id,
            'name' => 'Panadol Active',
            'base_unit_id' => $unit->id,
        ]);

        $batch1 = MedicineBatch::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'medicine_id' => $medicine->id,
            'batch_no' => 'BAT-001',
            'expiry_date' => now()->addYears(2),
            'quantity' => 100,
            'remaining_quantity' => 50,
            'purchase_price' => 10.00,
            'sale_price' => 15.00,
            'status' => 'ACTIVE',
        ]);

        // Sale 1: Today
        $saleToday = Sale::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'invoice_no' => 'INV-TODAY',
            'sale_date' => now()->toDateString(),
            'sub_total' => 300.00,
            'grand_total' => 300.00,
            'payment_status' => 'PAID',
            'payment_method' => 'CASH',
        ]);

        $saleItem1 = SaleItem::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_id' => $saleToday->id,
            'medicine_id' => $medicine->id,
            'unit_id' => $unit->id,
            'quantity' => 20,
            'unit_price' => 15.00,
            'conversion_factor' => 1.0,
            'base_quantity' => 20,
            'base_price' => 15.00,
        ]);

        SaleItemBatch::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_item_id' => $saleItem1->id,
            'batch_id' => $batch1->id,
            'quantity' => 20,
        ]);

        // Sale 2: Yesterday
        $saleYesterday = Sale::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'user_id' => $user->id,
            'invoice_no' => 'INV-YESTERDAY',
            'sale_date' => now()->subDay()->toDateString(),
            'sub_total' => 150.00,
            'grand_total' => 150.00,
            'payment_status' => 'PAID',
            'payment_method' => 'CASH',
        ]);

        $saleItem2 = SaleItem::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_id' => $saleYesterday->id,
            'medicine_id' => $medicine->id,
            'unit_id' => $unit->id,
            'quantity' => 10,
            'unit_price' => 15.00,
            'conversion_factor' => 1.0,
            'base_quantity' => 10,
            'base_price' => 15.00,
        ]);

        SaleItemBatch::create([
            'pharmacy_id' => $pharmacy->id,
            'sale_item_id' => $saleItem2->id,
            'batch_id' => $batch1->id,
            'quantity' => 10,
        ]);

        // Expense 1: Today
        $expenseCat = ExpenseCategory::create(['pharmacy_id' => $pharmacy->id, 'name' => 'Utilities']);
        Expense::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'expense_category_id' => $expenseCat->id,
            'amount' => 50.00,
            'expense_date' => now()->toDateString(),
        ]);

        // Expense 2: Yesterday
        Expense::create([
            'pharmacy_id' => $pharmacy->id,
            'branch_id' => $branch->id,
            'expense_category_id' => $expenseCat->id,
            'amount' => 30.00,
            'expense_date' => now()->subDay()->toDateString(),
        ]);

        Sanctum::actingAs($user);
        app()->offsetUnset('tenant.id');

        // Request with date range matching ONLY today
        $response = $this->getJson('/api/v1/financials/reports/summary?start_date=' . now()->toDateString() . '&end_date=' . now()->toDateString());

        $response->assertStatus(200);
        $data = $response->json();

        // Verify that yesterday's sale and expense are excluded
        $this->assertEquals(300.00, $data['summary']['total_sales']);
        $this->assertEquals(50.00, $data['summary']['total_expenses']);
        $this->assertEquals(200.00, $data['summary']['total_cogs']); // 20 units * 10 cost
        $this->assertEquals(100.00, $data['summary']['gross_profit']);
        $this->assertEquals(50.00, $data['summary']['net_profit']);

        $this->assertEquals(50.00, $data['expense_breakdown'][0]['value']);
        $this->assertEquals(20, $data['top_medicines'][0]['quantity_sold']);
    }
}
