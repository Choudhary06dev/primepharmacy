<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\MedicineBatch;
use App\Models\Supplier;
use App\Models\SupplierLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index()
    {
        $purchases = Purchase::with(['supplier'])->latest('id')->get();
        return response()->json($purchases);
    }

    /**
     * Store a newly created purchase transaction (stock inwarding + supplier ledger).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_no' => [
                'required',
                'string',
                'max:100',
                Rule::unique('purchases')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'purchase_date' => 'required|date',
            'sub_total' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_status' => ['required', Rule::in(['PAID', 'PARTIALLY_PAID', 'DUE'])],
            'payment_method' => 'required|string|max:50',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.conversion_factor' => 'required|numeric|min:0.0001',
            'items.*.batch_no' => 'required|string|max:100',
            'items.*.expiry_date' => 'required|date',
            'items.*.sale_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $pharmacyId = auth()->user()->pharmacy_id;
        $branchId = auth()->user()->branch_id ?? 1;

        DB::beginTransaction();
        try {
            // 1. Create Purchase record
            $purchase = Purchase::create([
                'pharmacy_id' => $pharmacyId,
                'branch_id' => $branchId,
                'supplier_id' => $data['supplier_id'],
                'purchase_no' => $data['purchase_no'],
                'purchase_date' => $data['purchase_date'],
                'sub_total' => $data['sub_total'],
                'tax' => $data['tax'] ?? 0.00,
                'discount' => $data['discount'] ?? 0.00,
                'grand_total' => $data['grand_total'],
                'paid_amount' => $data['paid_amount'],
                'payment_status' => $data['payment_status'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            // 2. Loop through items to create PurchaseItems and update stock batches
            foreach ($data['items'] as $item) {
                $baseQty = (int) round($item['quantity'] * $item['conversion_factor']);
                $basePrice = (double) ($item['unit_price'] / $item['conversion_factor']);

                PurchaseItem::create([
                    'pharmacy_id' => $pharmacyId,
                    'purchase_id' => $purchase->id,
                    'medicine_id' => $item['medicine_id'],
                    'unit_id' => $item['unit_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'conversion_factor' => $item['conversion_factor'],
                    'base_quantity' => $baseQty,
                    'base_price' => $basePrice,
                    'batch_no' => $item['batch_no'],
                    'expiry_date' => $item['expiry_date'],
                ]);

                // Check if batch already exists in this pharmacy/branch
                $existingBatch = MedicineBatch::where('pharmacy_id', $pharmacyId)
                    ->where('medicine_id', $item['medicine_id'])
                    ->where('batch_no', $item['batch_no'])
                    ->where('expiry_date', $item['expiry_date'])
                    ->first();

                if ($existingBatch) {
                    $existingBatch->update([
                        'quantity' => $existingBatch->quantity + $baseQty,
                        'remaining_quantity' => $existingBatch->remaining_quantity + $baseQty,
                        'purchase_price' => $basePrice,
                        'sale_price' => $item['sale_price'],
                        'status' => 'ACTIVE', // Reactivate if it was out of stock
                    ]);
                } else {
                    MedicineBatch::create([
                        'pharmacy_id' => $pharmacyId,
                        'branch_id' => $branchId,
                        'medicine_id' => $item['medicine_id'],
                        'batch_no' => $item['batch_no'],
                        'expiry_date' => $item['expiry_date'],
                        'purchase_price' => $basePrice,
                        'sale_price' => $item['sale_price'],
                        'quantity' => $baseQty,
                        'remaining_quantity' => $baseQty,
                        'status' => 'ACTIVE',
                    ]);
                }
            }

            // 3. Update Supplier balance
            $supplier = Supplier::find($data['supplier_id']);
            $netTransactionEffect = (double) ($data['grand_total'] - $data['paid_amount']);
            $supplier->increment('balance', $netTransactionEffect);

            // 4. Log Supplier Ledger Entry
            SupplierLedger::create([
                'pharmacy_id' => $pharmacyId,
                'supplier_id' => $supplier->id,
                'transaction_type' => 'PURCHASE',
                'transaction_id' => $purchase->id,
                'transaction_no' => $purchase->purchase_no,
                'debit' => $data['paid_amount'],
                'credit' => $data['grand_total'],
                'running_balance' => $supplier->balance,
                'transaction_date' => $data['purchase_date'],
            ]);

            DB::commit();

            $purchase->load(['supplier', 'items.medicine', 'items.unit']);

            return response()->json($purchase, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to register purchase: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified purchase details.
     */
    public function show(Purchase $purchase)
    {
        $purchase->load(['supplier', 'items.medicine.baseUnit', 'items.unit']);
        return response()->json($purchase);
    }
}
