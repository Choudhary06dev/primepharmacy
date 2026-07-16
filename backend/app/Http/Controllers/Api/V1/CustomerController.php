<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     * Scoping is handled automatically by TenantScope based on request parameters and user branch.
     */
    public function index(Request $request)
    {
        $customers = Customer::orderBy('name', 'asc')->get();
        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'nullable|phone',
            'email' => 'nullable|string|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $branchId = $authUser->branch_id;

        $customer = Customer::create([
            'name'      => $data['name'],
            'phone'     => $data['phone'] ?? null,
            'email'     => $data['email'] ?? null,
            'address'   => $data['address'] ?? null,
            'balance'   => 0.00,
            'branch_id' => $branchId,
        ]);

        return response()->json($customer, 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(Customer $customer)
    {
        return response()->json($customer);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, Customer $customer)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'nullable|phone',
            'email' => 'nullable|string|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer->update($validator->validated());

        return response()->json($customer);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer)
    {
        if ($customer->sales()->count() > 0 || $customer->ledgerEntries()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete customer: they have associated sales or ledger transactions.'
            ], 422);
        }

        $customer->delete();

        return response()->json(['success' => true]);
    }
}

