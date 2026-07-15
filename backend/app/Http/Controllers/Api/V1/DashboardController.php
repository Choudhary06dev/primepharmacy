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
        // Define branch scope target
        $targetBranchId = null;
        if (auth()->check()) {
            $user = auth()->user();
            $requestedBranchId = request()->query('branch_id');

            if ($user->pharmacy_id !== null && $user->branch_id !== null) {
                $userBranch = $user->branch;
                if ($userBranch && !$userBranch->is_main) {
                    // Sub-branch user: locked to their branch
                    $targetBranchId = (int)$user->branch_id;
                } elseif ($requestedBranchId && is_numeric($requestedBranchId)) {
                    // Main branch user with specific branch filter
                    $targetBranchId = (int)$requestedBranchId;
                }
            }
        }

        // 1. Today's Sales & growth/decline percentage from yesterday
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        $todaySales = (double) Sale::where('sale_date', $today)
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
            ->sum('grand_total');
        $yesterdaySales = (double) Sale::where('sale_date', $yesterday)
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
            ->sum('grand_total');

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
        $totalPurchases = Purchase::when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))->count();
        $thisMonthPurchases = Purchase::whereMonth('purchase_date', Carbon::now()->month)
            ->whereYear('purchase_date', Carbon::now()->year)
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
            ->count();

        // 3. Active Batches
        $activeBatches = MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
            ->count();

        // 4. Low Stock Alerts & Critical warnings (Optimized join aggregate subquery)
        $subquery = MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->select('medicine_id')
            ->selectRaw('SUM(remaining_quantity) as total_remaining')
            ->groupBy('medicine_id');

        if ($targetBranchId) {
            $subquery->where('branch_id', $targetBranchId);
        }

        $stockStats = Medicine::where('is_active', true)
            ->leftJoinSub(
                $subquery,
                'mb',
                'mb.medicine_id',
                '=',
                'medicines.id'
            )
            ->selectRaw("
                COUNT(CASE WHEN COALESCE(mb.total_remaining, 0) <= medicines.min_stock_level THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN COALESCE(mb.total_remaining, 0) = 0 AND medicines.min_stock_level > 0 THEN 1 END) as critical_warnings
            ")
            ->first();

        $lowStockCount = (int) ($stockStats->low_stock_count ?? 0);
        $criticalWarnings = (int) ($stockStats->critical_warnings ?? 0);

        // 5. This Month's Sales (MTD)
        $thisMonthSales = (double) Sale::whereMonth('sale_date', Carbon::now()->month)
            ->whereYear('sale_date', Carbon::now()->year)
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
            ->sum('grand_total');

        // 6. Expired Batches (FEFO alert)
        $expiredBatches = MedicineBatch::where('status', 'ACTIVE')
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '<', Carbon::now()->toDateString())
            ->when($targetBranchId, fn($q) => $q->where('branch_id', $targetBranchId))
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
