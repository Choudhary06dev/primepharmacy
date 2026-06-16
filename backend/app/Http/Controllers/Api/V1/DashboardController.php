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
 
        // 4. Low Stock Alerts & Critical warnings
        $medicines = Medicine::where('is_active', true)
            ->withSum(['batches' => function ($query) {
                $query->where('status', 'ACTIVE')->where('remaining_quantity', '>', 0);
            }], 'remaining_quantity')
            ->get();
 
        $lowStockCount = 0;
        $criticalWarnings = 0;
 
        foreach ($medicines as $med) {
            $stock = (int) ($med->batches_sum_remaining_quantity ?? 0);
            $minStock = (int) ($med->min_stock_level ?? 0);
 
            if ($stock <= $minStock) {
                $lowStockCount++;
                if ($stock === 0 && $minStock > 0) {
                    $criticalWarnings++;
                }
            }
        }
 
        return response()->json([
            'today_sales' => $todaySales,
            'today_sales_change' => $salesChangeStr,
            'purchase_orders' => $totalPurchases,
            'purchase_orders_this_month' => $thisMonthPurchases,
            'active_batches' => $activeBatches,
            'low_stock_alerts' => $lowStockCount,
            'critical_warnings' => $criticalWarnings,
        ]);
    }
}
