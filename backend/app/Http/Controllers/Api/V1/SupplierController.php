<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     * Scoping is handled automatically by TenantScope based on request parameters and user branch.
     */
    public function index(Request $request)
    {
        $suppliers = Supplier::orderBy('name', 'asc')->get();
        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers')->where(function ($query) use ($authUser) {
                    return $query->where('pharmacy_id', $authUser->pharmacy_id);
                })
            ],
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|phone',
            'email' => 'nullable|string|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $branchId = $authUser->branch_id;

        $supplier = Supplier::create([
            'name'           => $data['name'],
            'contact_person' => $data['contact_person'] ?? null,
            'phone'          => $data['phone'] ?? null,
            'email'          => $data['email'] ?? null,
            'address'        => $data['address'] ?? null,
            'balance'        => 0.00,
            'branch_id'      => $branchId,
        ]);

        return response()->json($supplier, 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $authUser = $request->user();
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers')->where(function ($query) use ($authUser) {
                    return $query->where('pharmacy_id', $authUser->pharmacy_id);
                })->ignore($supplier->id)
            ],
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|phone',
            'email' => 'nullable|string|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supplier->update($validator->validated());

        return response()->json($supplier);
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Supplier $supplier)
    {
        if ($supplier->purchases()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier: they have associated purchase invoices.'
            ], 422);
        }

        $supplier->delete();

        return response()->json(['success' => true]);
    }
}
