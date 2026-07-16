<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies with medicines count.
     */
    public function index()
    {
        $companies = Company::withCount('medicines')->get();
        return response()->json($companies);
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('companies')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|phone',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::create($validator->validated());
        $company->medicines_count = 0;

        return response()->json($company, 201);
    }

    /**
     * Display the specified company.
     */
    public function show(Company $company)
    {
        $company->loadCount('medicines');
        return response()->json($company);
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('companies')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($company->id)
            ],
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|phone',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($validator->validated());
        $company->loadCount('medicines');

        return response()->json($company);
    }

    /**
     * Remove the specified company.
     */
    public function destroy(Company $company)
    {
        if ($company->medicines()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete manufacturer: medicines are linked to this company.'
            ], 422);
        }

        $company->delete();

        return response()->json(['success' => true]);
    }
}
