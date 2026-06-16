<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\MedicineBatch;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get financial reports and dashboard analytics summary.
     */
    public function summary(Request $request)
    {
        $pharmacyId = auth()->user()->pharmacy_id;
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Parse date strings to start and end of day format
        $start = $startDate ? Carbon::parse($startDate)->startOfDay()->toDateTimeString() : null;
        $end = $endDate ? Carbon::parse($endDate)->endOfDay()->toDateTimeString() : null;

        // 1. Sales, Expenses & Profits calculations
        $salesQuery = Sale::query();
        $expensesQuery = Expense::query();

        if ($start && $end) {
            $salesQuery->whereBetween('sale_date', [$start, $end]);
            $expensesQuery->whereBetween('expense_date', [$start, $end]);
        }

        $totalSales = (double) $salesQuery->sum('grand_total');
        $totalExpenses = (double) $expensesQuery->sum('amount');

        // Cost of Goods Sold (COGS)
        $cogsQuery = DB::table('sale_item_batches')
            ->join('medicine_batches', 'sale_item_batches.batch_id', '=', 'medicine_batches.id')
            ->join('sale_items', 'sale_item_batches.sale_item_id', '=', 'sale_items.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sale_item_batches.pharmacy_id', $pharmacyId);

        if ($start && $end) {
            $cogsQuery->whereBetween('sales.sale_date', [$start, $end]);
        }

        $totalCOGS = (double) $cogsQuery->sum(DB::raw('sale_item_batches.quantity * medicine_batches.purchase_price'));

        $grossProfit = $totalSales - $totalCOGS;
        $netProfit = $grossProfit - $totalExpenses;

        // 2. Monthly Sales Trend (Last 6 Months)
        $monthlySales = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthLabel = $month->format('M Y');
            $salesVal = (double) Sale::whereMonth('sale_date', $month->month)
                ->whereYear('sale_date', $month->year)
                ->sum('grand_total');
                
            $monthlySales[] = [
                'label' => $monthLabel,
                'sales' => $salesVal
            ];
        }

        // 3. Expense Category Breakdown
        $expenseBreakdownQuery = DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.pharmacy_id', $pharmacyId);

        if ($start && $end) {
            $expenseBreakdownQuery->whereBetween('expenses.expense_date', [$start, $end]);
        }

        $expenseBreakdown = $expenseBreakdownQuery
            ->select('expense_categories.name as category_name', DB::raw('SUM(expenses.amount) as total_amount'))
            ->groupBy('expense_categories.name')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category_name,
                    'value' => (double) $item->total_amount
                ];
            });

        // 4. Top 5 Selling Medicines
        $topMedicinesQuery = DB::table('sale_items')
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sale_items.pharmacy_id', $pharmacyId);

        if ($start && $end) {
            $topMedicinesQuery->whereBetween('sales.sale_date', [$start, $end]);
        }

        $topMedicines = $topMedicinesQuery
            ->select(
                'medicines.name',
                'medicines.generic_name',
                DB::raw('SUM(sale_items.base_quantity) as total_sold'),
                DB::raw('SUM(sale_items.base_quantity * sale_items.base_price) as total_revenue')
            )
            ->groupBy('medicines.id', 'medicines.name', 'medicines.generic_name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'generic_name' => $item->generic_name,
                    'quantity_sold' => (int) $item->total_sold,
                    'revenue' => (double) $item->total_revenue
                ];
            });

        // 5. Inventory Valuation (Active stock assets value)
        $inventoryCostValue = (double) MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->sum(DB::raw('remaining_quantity * purchase_price'));

        $inventoryRetailValue = (double) MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->sum(DB::raw('remaining_quantity * sale_price'));

        $inventoryProfitMargin = $inventoryRetailValue - $inventoryCostValue;

        return response()->json([
            'summary' => [
                'total_sales' => $totalSales,
                'total_expenses' => $totalExpenses,
                'total_cogs' => $totalCOGS,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
            ],
            'monthly_trend' => $monthlySales,
            'expense_breakdown' => $expenseBreakdown,
            'top_medicines' => $topMedicines,
            'inventory_valuation' => [
                'cost_value' => $inventoryCostValue,
                'retail_value' => $inventoryRetailValue,
                'margin' => $inventoryProfitMargin,
            ]
        ]);
    }
}
