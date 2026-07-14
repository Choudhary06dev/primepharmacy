<?php
 
namespace App\Http\Controllers\Api\V1;
 
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\MedicineBatch;
use App\Models\Medicine;
use Carbon\Carbon;
use Illuminate\Http\Request;
 
class DashboardController extends Controller
{
    /**
     * Fetch key statistics for the dashboard.
     */
    public function stats()
    {
        // 1. Today's Sales & growth/decline percentage from yesterday
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();
 
        $todaySales = (double) Sale::where('sale_date', $today)->sum('grand_total');
        $yesterdaySales = (double) Sale::where('sale_date', $yesterday)->sum('grand_total');
 
        $salesChangePercent = 0;
        if ($yesterdaySales > 0) {
            $salesChangePercent = (($todaySales - $yesterdaySales) / $yesterdaySales) * 100;
        } else if ($todaySales > 0) {
            $salesChangePercent = 100;
        }
 
        // Formatted sales change string
        if ($salesChangePercent > 0) {
            $salesChangeStr = '+' . number_format($salesChangePercent, 1) . '% from yesterday';
        } elseif ($salesChangePercent < 0) {
            $salesChangeStr = number_format($salesChangePercent, 1) . '% from yesterday';
        } else {
            $salesChangeStr = '0% from yesterday';
        }
 
        // 2. Purchase Orders
        $totalPurchases = Purchase::count();
        $thisMonthPurchases = Purchase::whereMonth('purchase_date', Carbon::now()->month)
            ->whereYear('purchase_date', Carbon::now()->year)
            ->count();
 
        // 3. Active Batches
        $activeBatches = MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->count();
 
        // 4. Low Stock Alerts & Critical warnings (Optimized aggregated SQL query)
        $pharmacyId = app()->bound('tenant.id') ? (int) app('tenant.id') : 0;

        $stockStats = Medicine::where('is_active', true)
            ->selectRaw("
                COUNT(CASE WHEN (
                    SELECT COALESCE(SUM(remaining_quantity), 0)
                    FROM medicine_batches
                    WHERE medicine_batches.medicine_id = medicines.id
                      AND medicine_batches.status = 'ACTIVE'
                      AND medicine_batches.remaining_quantity > 0
                      AND medicine_batches.pharmacy_id = {$pharmacyId}
                ) <= medicines.min_stock_level THEN 1 END) as low_stock_count,
                
                COUNT(CASE WHEN (
                    SELECT COALESCE(SUM(remaining_quantity), 0)
                    FROM medicine_batches
                    WHERE medicine_batches.medicine_id = medicines.id
                      AND medicine_batches.status = 'ACTIVE'
                      AND medicine_batches.remaining_quantity > 0
                      AND medicine_batches.pharmacy_id = {$pharmacyId}
                ) = 0 AND medicines.min_stock_level > 0 THEN 1 END) as critical_warnings
            ")
            ->first();

        $lowStockCount = (int) ($stockStats->low_stock_count ?? 0);
        $criticalWarnings = (int) ($stockStats->critical_warnings ?? 0);

        // 5. This Month's Sales (MTD)
        $thisMonthSales = (double) Sale::whereMonth('sale_date', Carbon::now()->month)
            ->whereYear('sale_date', Carbon::now()->year)
            ->sum('grand_total');

        // 6. Expired Batches (FEFO alert)
        $expiredBatches = MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '<', Carbon::now()->toDateString())
            ->count();
 
        return response()->json([
            'today_sales' => $todaySales,
            'today_sales_change' => $salesChangeStr,
            'purchase_orders' => $totalPurchases,
            'purchase_orders_this_month' => $thisMonthPurchases,
            'active_batches' => $activeBatches,
            'low_stock_alerts' => $lowStockCount,
            'critical_warnings' => $criticalWarnings,
            'this_month_sales' => $thisMonthSales,
            'expired_batches' => $expiredBatches,
        ]);
    }
}
