<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of expense categories.
     */
    public function index()
    {
        $categories = ExpenseCategory::orderBy('name', 'asc')->get();
        return response()->json($categories);
    }

    /**
     * Store a newly created expense category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('expense_categories')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $category = ExpenseCategory::create($validator->validated());
        return response()->json($category, 201);
    }

    /**
     * Display the specified expense category.
     */
    public function show(ExpenseCategory $category)
    {
        return response()->json($category);
    }

    /**
     * Update the specified expense category.
     */
    public function update(Request $request, ExpenseCategory $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('expense_categories')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($category->id)
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $category->update($validator->validated());
        return response()->json($category);
    }

    /**
     * Remove the specified expense category.
     */
    public function destroy(ExpenseCategory $category)
    {
        if ($category->expenses()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category: it has registered expenses.'
            ], 422);
        }

        $category->delete();
        return response()->json(['success' => true]);
    }
}
