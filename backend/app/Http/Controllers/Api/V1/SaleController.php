<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\MedicineBatch;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    /**
     * Display a listing of sales.
     */
    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'user']);

        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(invoice_no) like ?', ["%{$search}%"])
                  ->orWhereHas('customer', function ($qSub) use ($search) {
                      $qSub->whereRaw('LOWER(name) like ?', ["%{$search}%"]);
                  });
            });
        }

        if ($request->query('paginate') === 'false') {
            $sales = $query->latest('id')->get();
            return response()->json($sales);
        }

        $perPage = $request->query('per_page', 25);
        $sales = $query->latest('id')->paginate($perPage);
        return response()->json($sales);
    }

    /**
     * Store a newly created checkout transaction (FEFO enabled).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'sub_total' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_status' => ['required', Rule::in(['PAID', 'PARTIALLY_PAID', 'DUE'])],
            'payment_method' => 'required|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.conversion_factor' => 'required|numeric|min:0.0001',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $branchId = auth()->user()->branch_id ?? 1;

        DB::beginTransaction();
        try {
            // Generate Invoice Number (Format: INV-YYYYMMDD-XXXX)
            $date = now()->format('Ymd');
            $count = Sale::whereDate('created_at', now()->toDateString())->count() + 1;
            $invoice_no = 'INV-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // 1. Create Sale Transaction Record
            $sale = Sale::create([
                'pharmacy_id' => auth()->user()->pharmacy_id,
                'branch_id' => $branchId,
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => auth()->user()->id,
                'invoice_no' => $invoice_no,
                'sale_date' => now()->toDateString(),
                'sub_total' => $data['sub_total'],
                'tax' => $data['tax'] ?? 0.00,
                'discount' => $data['discount'] ?? 0.00,
                'grand_total' => $data['grand_total'],
                'paid_amount' => $data['paid_amount'],
                'payment_status' => $data['payment_status'],
                'payment_method' => $data['payment_method'],
            ]);

            // 2. Process items and deduct batches (FEFO)
            foreach ($data['items'] as $item) {
                $baseQty = (int) round($item['quantity'] * $item['conversion_factor']);
                $basePrice = $item['unit_price'] / $item['conversion_factor'];

                // Retrieve active batches sorted by FEFO (earliest expiry first)
                $activeBatches = MedicineBatch::where('medicine_id', $item['medicine_id'])
                    ->where('branch_id', $branchId)
                    ->where('status', 'ACTIVE')
                    ->where('remaining_quantity', '>', 0)
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                $availableStock = $activeBatches->sum('remaining_quantity');
                if ($availableStock < $baseQty) {
                    throw new \Exception("Insufficient stock for medicine ID {$item['medicine_id']}. Available: {$availableStock}, Requested: {$baseQty}");
                }

                // Create Sale Item Record
                $saleItem = $sale->items()->create([
                    'pharmacy_id' => auth()->user()->pharmacy_id,
                    'medicine_id' => $item['medicine_id'],
                    'unit_id' => $item['unit_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'conversion_factor' => $item['conversion_factor'],
                    'base_quantity' => $baseQty,
                    'base_price' => $basePrice,
                ]);

                // Deduct from batches (FEFO)
                $qtyToDeduct = $baseQty;
                foreach ($activeBatches as $batch) {
                    if ($qtyToDeduct <= 0) break;

                    $deducted = min($batch->remaining_quantity, $qtyToDeduct);
                    $batch->remaining_quantity -= $deducted;
                    if ($batch->remaining_quantity <= 0) {
                        $batch->status = 'OUT_OF_STOCK';
                    }
                    $batch->save();

                    // Link Sale Item to Batch
                    $saleItem->batches()->create([
                        'pharmacy_id' => auth()->user()->pharmacy_id,
                        'batch_id' => $batch->id,
                        'quantity' => $deducted,
                    ]);

                    $qtyToDeduct -= $deducted;
                }
            }

            // 3. Sync Customer Ledger / Balance if customer selected
            if (!empty($data['customer_id'])) {
                $customer = Customer::find($data['customer_id']);
                if ($customer) {
                    $dueAmount = $data['grand_total'] - $data['paid_amount'];
                    $customer->balance += $dueAmount;
                    $customer->save();

                    // Log customer ledger transaction
                    \App\Models\CustomerLedger::create([
                        'pharmacy_id' => auth()->user()->pharmacy_id,
                        'customer_id' => $customer->id,
                        'transaction_type' => 'SALE',
                        'transaction_id' => $sale->id,
                        'transaction_no' => $sale->invoice_no,
                        'debit' => $data['grand_total'],
                        'credit' => $data['paid_amount'],
                        'running_balance' => $customer->balance,
                        'transaction_date' => $sale->sale_date,
                    ]);
                }
            }

            DB::commit();

            // Load and return invoice detail
            $sale->load(['customer', 'user', 'branch', 'items.medicine', 'items.unit', 'items.batches.batch']);

            return response()->json([
                'message' => 'Sale checkout processed successfully.',
                'sale' => $sale,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleSafeError($e, 'Failed to process sale checkout', 422);
        }
    }

    /**
     * Display sale details (Invoice receipt view).
     */
    public function show($id)
    {
        $sale = Sale::with(['customer', 'user', 'branch', 'items.medicine.baseUnit', 'items.unit', 'items.batches.batch'])
            ->findOrFail($id);
            
        return response()->json($sale);
    }
}
