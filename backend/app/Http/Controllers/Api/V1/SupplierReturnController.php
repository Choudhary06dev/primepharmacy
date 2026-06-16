<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnItem;
use App\Models\PurchaseItem;
use App\Models\MedicineBatch;
use App\Models\Supplier;
use App\Models\SupplierLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SupplierReturnController extends Controller
{
    /**
     * Display a listing of supplier returns.
     */
    public function index()
    {
        $returns = SupplierReturn::with(['supplier', 'purchase', 'items.medicine'])->latest('id')->get();
        return response()->json($returns);
    }

    /**
     * Store a newly created return.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_id' => 'required|exists:purchases,id',
            'return_no' => [
                'required',
                'string',
                'max:100',
                Rule::unique('supplier_returns')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'return_date' => 'required|date',
            'grand_total' => 'required|numeric|min:0',
            'refunded_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.refund_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $pharmacyId = auth()->user()->pharmacy_id;
        $branchId = auth()->user()->branch_id ?? 1;

        DB::beginTransaction();
        try {
            $returnRecord = SupplierReturn::create([
                'pharmacy_id' => $pharmacyId,
                'branch_id' => $branchId,
                'supplier_id' => $data['supplier_id'],
                'purchase_id' => $data['purchase_id'],
                'return_no' => $data['return_no'],
                'return_date' => $data['return_date'],
                'grand_total' => $data['grand_total'],
                'refunded_amount' => $data['refunded_amount'],
            ]);

            // Save items & update stock
            foreach ($data['items'] as $item) {
                $purchaseItem = PurchaseItem::findOrFail($item['purchase_item_id']);
                $baseQty = (int) round($item['quantity'] * $purchaseItem->conversion_factor);

                // Find the associated MedicineBatch
                $batch = MedicineBatch::where('pharmacy_id', $pharmacyId)
                    ->where('medicine_id', $purchaseItem->medicine_id)
                    ->where('batch_no', $purchaseItem->batch_no)
                    ->where('expiry_date', $purchaseItem->expiry_date)
                    ->first();

                if (!$batch) {
                    throw new \Exception("Medicine batch " . $purchaseItem->batch_no . " not found in inventory for " . $purchaseItem->medicine->name);
                }

                // Decrement batch remaining quantity
                $newRemaining = max(0, $batch->remaining_quantity - $baseQty);
                $batch->remaining_quantity = $newRemaining;
                if ($newRemaining === 0) {
                    $batch->status = 'OUT_OF_STOCK';
                }
                $batch->save();

                // Save supplier return item
                SupplierReturnItem::create([
                    'pharmacy_id' => $pharmacyId,
                    'supplier_return_id' => $returnRecord->id,
                    'purchase_item_id' => $purchaseItem->id,
                    'medicine_id' => $purchaseItem->medicine_id,
                    'unit_id' => $purchaseItem->unit_id,
                    'quantity' => $item['quantity'],
                    'base_quantity' => $baseQty,
                    'refund_price' => $item['refund_price'],
                    'batch_id' => $batch->id,
                ]);
            }

            // Adjust Supplier Balance (Return decreases our liability to supplier)
            $supplier = Supplier::find($data['supplier_id']);
            $supplier->decrement('balance', $data['refunded_amount']);

            // Create Supplier Ledger Entry
            SupplierLedger::create([
                'pharmacy_id' => $pharmacyId,
                'supplier_id' => $supplier->id,
                'transaction_type' => 'RETURN',
                'transaction_id' => $returnRecord->id,
                'transaction_no' => $returnRecord->return_no,
                'debit' => $data['refunded_amount'], // Debit reduces payable balance
                'credit' => 0.00,
                'running_balance' => $supplier->balance,
                'transaction_date' => $data['return_date'],
            ]);

            DB::commit();

            $returnRecord->load(['supplier', 'purchase', 'items.medicine', 'items.unit']);

            return response()->json($returnRecord, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record supplier return: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified supplier return details.
     */
    public function show(SupplierReturn $supplierReturn)
    {
        $supplierReturn->load(['supplier', 'purchase', 'items.medicine.baseUnit', 'items.unit', 'items.batch']);
        return response()->json($supplierReturn);
    }
}
