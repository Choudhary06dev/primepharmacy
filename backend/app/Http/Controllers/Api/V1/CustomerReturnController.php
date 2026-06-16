<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerReturn;
use App\Models\Customer;
use App\Models\CustomerLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerReturnController extends Controller
{
    /**
     * Display a listing of customer returns.
     */
    public function index()
    {
        $returns = CustomerReturn::with(['customer', 'sale'])->latest('id')->get();
        return response()->json($returns);
    }

    /**
     * Store a newly created return.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'sale_id' => 'nullable|exists:sales,id',
            'return_no' => [
                'required',
                'string',
                'max:100',
                Rule::unique('customer_returns')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'return_date' => 'required|date',
            'grand_total' => 'required|numeric|min:0',
            'refunded_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $pharmacyId = auth()->user()->pharmacy_id;
        $branchId = auth()->user()->branch_id ?? 1;

        DB::beginTransaction();
        try {
            $returnRecord = CustomerReturn::create([
                'pharmacy_id' => $pharmacyId,
                'branch_id' => $branchId,
                'customer_id' => $data['customer_id'],
                'sale_id' => $data['sale_id'] ?? null,
                'return_no' => $data['return_no'],
                'return_date' => $data['return_date'],
                'grand_total' => $data['grand_total'],
                'refunded_amount' => $data['refunded_amount'],
            ]);

            // Adjust Customer Balance (Return decreases what the customer owes us)
            $customer = Customer::find($data['customer_id']);
            $customer->decrement('balance', $data['refunded_amount']);

            // Create Customer Ledger Entry
            CustomerLedger::create([
                'pharmacy_id' => $pharmacyId,
                'customer_id' => $customer->id,
                'transaction_type' => 'RETURN',
                'transaction_id' => $returnRecord->id,
                'transaction_no' => $returnRecord->return_no,
                'debit' => 0.00,
                'credit' => $data['refunded_amount'], // Credit reduces the receivable asset
                'running_balance' => $customer->balance,
                'transaction_date' => $data['return_date'],
            ]);

            DB::commit();

            $returnRecord->load(['customer', 'sale']);

            return response()->json($returnRecord, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record customer return: ' . $e->getMessage()], 500);
        }
    }
}
