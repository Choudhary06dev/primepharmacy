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
     */
    public function index()
    {
        $customers = Customer::orderBy('name', 'asc')->get();
        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $customer = Customer::create([
            ...$validator->validated(),
            'balance' => 0.00,
        ]);

        return response()->json($customer, 201);
    }
}
