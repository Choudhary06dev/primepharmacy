<?php

namespace App\Domains\Sales\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemBatch;
use App\Models\MedicineBatch;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Domains\Inventory\Services\UnitConversionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Exception;

class SaleService
{
    protected UnitConversionService $conversionService;

    public function __construct(UnitConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    /**
     * Process a retail sale (POS checkout) with FEFO inventory deduction.
     */
    public function createSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $pharmacyId = app('tenant.id');
            if (!$pharmacyId) {
                throw new InvalidArgumentException("Tenant context is required to record a sale.");
            }

            $invoiceNo = $data['invoice_no'] ?? 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $saleDate = $data['sale_date'] ?? now()->toDateString();

            // 1. Create Sale
            $sale = Sale::create([
                'pharmacy_id' => $pharmacyId,
                'branch_id' => $data['branch_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $data['user_id'], // Cashier user
                'invoice_no' => $invoiceNo,
                'sale_date' => $saleDate,
                'sub_total' => $data['sub_total'],
                'tax' => $data['tax'] ?? 0.00,
                'discount' => $data['discount'] ?? 0.00,
                'grand_total' => $data['grand_total'],
                'paid_amount' => $data['paid_amount'] ?? 0.00,
                'payment_status' => $data['payment_status'],
                'payment_method' => $data['payment_method'],
            ]);

            // 2. Process items
            foreach ($data['items'] as $item) {
                $baseQuantity = $this->conversionService->convertToBaseUnits(
                    $item['medicine_id'],
                    $item['unit_id'],
                    $item['quantity']
                );

                $conversionFactor = $baseQuantity / $item['quantity'];
                $basePrice = $item['unit_price'] / $conversionFactor;

                // Create Sale line item
                $saleItem = SaleItem::create([
                    'pharmacy_id' => $pharmacyId,
                    'sale_id' => $sale->id,
                    'medicine_id' => $item['medicine_id'],
                    'unit_id' => $item['unit_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'base_price' => $basePrice,
                ]);

                // FEFO batch stock deduction
                $remainingToDeduct = $baseQuantity;

                $batches = MedicineBatch::where('medicine_id', $item['medicine_id'])
                    ->where('branch_id', $data['branch_id'])
                    ->where('remaining_quantity', '>', 0)
                    ->where('expiry_date', '>', $saleDate)
                    ->where('status', 'ACTIVE')
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                $totalAvailable = $batches->sum('remaining_quantity');
                if ($totalAvailable < $baseQuantity) {
                    throw new Exception("Insufficient stock for medicine ID {$item['medicine_id']}. Requested base units: {$baseQuantity}, Available active units: {$totalAvailable}.");
                }

                foreach ($batches as $batch) {
                    if ($remainingToDeduct <= 0) {
                        break;
                    }

                    $deductQuantity = min($batch->remaining_quantity, $remainingToDeduct);

                    $batch->remaining_quantity -= $deductQuantity;
                    if ($batch->remaining_quantity === 0) {
                        $batch->status = 'OUT_OF_STOCK';
                    }
                    $batch->save();

                    // Track exact batch from which this line item stock was pulled
                    SaleItemBatch::create([
                        'pharmacy_id' => $pharmacyId,
                        'sale_item_id' => $saleItem->id,
                        'batch_id' => $batch->id,
                        'quantity' => $deductQuantity,
                    ]);

                    $remainingToDeduct -= $deductQuantity;
                }
            }

            // 3. Update Customer balance (if registered customer, not walk-in)
            if ($sale->customer_id) {
                $customer = Customer::findOrFail($sale->customer_id);
                // What customer owes us = Grand Total - Paid Amount
                $netDebit = $sale->grand_total - $sale->paid_amount;
                $customer->increment('balance', $netDebit);

                // Record in Customer Ledger
                CustomerLedger::create([
                    'pharmacy_id' => $pharmacyId,
                    'customer_id' => $customer->id,
                    'transaction_type' => 'SALE',
                    'transaction_id' => $sale->id,
                    'transaction_no' => $invoiceNo,
                    'debit' => $sale->grand_total,
                    'credit' => $sale->paid_amount,
                    'running_balance' => $customer->balance,
                    'transaction_date' => $saleDate,
                ]);
            }

            return $sale;
        });
    }
}
