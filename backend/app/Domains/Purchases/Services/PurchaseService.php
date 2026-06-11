<?php

namespace App\Domains\Purchases\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\MedicineBatch;
use App\Models\Supplier;
use App\Models\SupplierLedger;
use App\Domains\Inventory\Services\UnitConversionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PurchaseService
{
    protected UnitConversionService $conversionService;

    public function __construct(UnitConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    /**
     * Process and save a purchase order.
     */
    public function createPurchase(array $data): Purchase
    {
        return DB::transaction(function () use ($data) {
            $pharmacyId = app('tenant.id');
            if (!$pharmacyId) {
                throw new InvalidArgumentException("Tenant context is required to create a purchase.");
            }

            // 1. Generate unique purchase number
            $purchaseNo = $data['purchase_no'] ?? 'PRC-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // 2. Fetch Supplier
            $supplier = Supplier::findOrFail($data['supplier_id']);

            // 3. Create Purchase
            $purchase = Purchase::create([
                'pharmacy_id' => $pharmacyId,
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'purchase_no' => $purchaseNo,
                'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
                'sub_total' => $data['sub_total'],
                'tax' => $data['tax'] ?? 0.00,
                'discount' => $data['discount'] ?? 0.00,
                'grand_total' => $data['grand_total'],
                'paid_amount' => $data['paid_amount'] ?? 0.00,
                'payment_status' => $data['payment_status'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            // 4. Save items & create batches
            foreach ($data['items'] as $item) {
                $baseQuantity = $this->conversionService->convertToBaseUnits(
                    $item['medicine_id'],
                    $item['unit_id'],
                    $item['quantity']
                );

                $conversionFactor = $baseQuantity / $item['quantity'];
                $basePrice = $item['unit_price'] / $conversionFactor;

                // Create purchase line item
                PurchaseItem::create([
                    'pharmacy_id' => $pharmacyId,
                    'purchase_id' => $purchase->id,
                    'medicine_id' => $item['medicine_id'],
                    'unit_id' => $item['unit_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'base_price' => $basePrice,
                    'batch_no' => $item['batch_no'],
                    'expiry_date' => $item['expiry_date'],
                ]);

                // Create a new medicine inventory batch
                MedicineBatch::create([
                    'pharmacy_id' => $pharmacyId,
                    'branch_id' => $data['branch_id'],
                    'medicine_id' => $item['medicine_id'],
                    'batch_no' => $item['batch_no'],
                    'expiry_date' => $item['expiry_date'],
                    'purchase_price' => $basePrice,
                    'sale_price' => $item['sale_price'] ?? ($basePrice * 1.25), // Default 25% markup
                    'quantity' => $baseQuantity,
                    'remaining_quantity' => $baseQuantity,
                    'status' => 'ACTIVE',
                ]);
            }

            // 5. Update Supplier Balance
            $netCredit = $purchase->grand_total - $purchase->paid_amount;
            $supplier->increment('balance', $netCredit);

            // 6. Record in Supplier Ledger
            SupplierLedger::create([
                'pharmacy_id' => $pharmacyId,
                'supplier_id' => $supplier->id,
                'transaction_type' => 'PURCHASE',
                'transaction_id' => $purchase->id,
                'transaction_no' => $purchaseNo,
                'debit' => $purchase->paid_amount,
                'credit' => $purchase->grand_total,
                'running_balance' => $supplier->balance,
                'transaction_date' => $purchase->purchase_date,
            ]);

            return $purchase;
        });
    }
}
