<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MedicineBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MedicineBatchController extends Controller
{
    /**
     * Display a listing of medicine batches with medicine details.
     */
    public function index()
    {
        $batches = MedicineBatch::with(['medicine.baseUnit', 'medicine.category', 'medicine.company'])->get();
        return response()->json($batches);
    }

    /**
     * Store a newly created batch.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'batch_no' => 'required|string|max:100',
            'expiry_date' => 'required|date|after:today',
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $batch = MedicineBatch::create([
            'medicine_id' => $data['medicine_id'],
            'batch_no' => $data['batch_no'],
            'expiry_date' => $data['expiry_date'],
            'purchase_price' => $data['purchase_price'],
            'sale_price' => $data['sale_price'],
            'quantity' => $data['quantity'],
            'remaining_quantity' => $data['quantity'],
            'status' => 'ACTIVE',
            'branch_id' => auth()->user()->branch_id ?? 1, // Fallback if no branch assigned
        ]);

        $batch->load(['medicine.baseUnit']);

        return response()->json($batch, 201);
    }

    /**
     * Display the specified batch.
     */
    public function show(MedicineBatch $batch)
    {
        $batch->load(['medicine.baseUnit']);
        return response()->json($batch);
    }

    /**
     * Update the specified batch.
     */
    public function update(Request $request, MedicineBatch $batch)
    {
        $validator = Validator::make($request->all(), [
            'batch_no' => 'required|string|max:100',
            'expiry_date' => 'required|date',
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'remaining_quantity' => 'required|integer|min:0',
            'status' => ['required', Rule::in(['ACTIVE', 'OUT_OF_STOCK', 'EXPIRED'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $batch->update($data);
        $batch->load(['medicine.baseUnit']);

        return response()->json($batch);
    }

    /**
     * Remove the specified batch.
     */
    public function destroy(MedicineBatch $batch)
    {
        // Check if there are sales transactions referencing this batch
        // via sale_item_batches
        try {
            $batch->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Cannot delete batch: it has already been checked out in sales transactions.'
            ], 422);
        }
    }
}
