<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories with medicines count.
     */
    public function index()
    {
        $categories = Category::withCount('medicines')->get();
        return response()->json($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = Category::create($validator->validated());
        $category->medicines_count = 0;

        return response()->json($category, 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        $category->loadCount('medicines');
        return response()->json($category);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($category->id)
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category->update($validator->validated());
        $category->loadCount('medicines');

        return response()->json($category);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category)
    {
        if ($category->medicines()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category: medicines are currently classified under it.'
            ], 422);
        }

        $category->delete();

        return response()->json(['success' => true]);
    }
}
