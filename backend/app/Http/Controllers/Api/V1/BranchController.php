<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    /**
     * Display a listing of branches for the current pharmacy.
     */
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Branch::query();

        if ($authUser->pharmacy_id === null && $request->has('pharmacy_id')) {
            $query->where('pharmacy_id', $request->query('pharmacy_id'));
        }

        $branches = $query->withCount(['users', 'sales', 'purchases'])
            ->orderByDesc('is_main')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($branches);
    }

    /**
     * Store a newly created branch.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();
        
        $rules = [
            'name' => 'required|string|max:150',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|phone',
            'is_main' => 'nullable|boolean',
        ];

        if ($authUser->pharmacy_id === null) {
            $rules['pharmacy_id'] = 'required|exists:pharmacies,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $pharmacyId = $authUser->pharmacy_id !== null ? $authUser->pharmacy_id : $data['pharmacy_id'];

        // Check duplicate name within the same pharmacy
        $exists = Branch::where('name', $data['name'])
            ->where('pharmacy_id', $pharmacyId)
            ->exists();

        if ($exists) {
            return response()->json(['errors' => ['name' => ['A branch with this name already exists in the selected pharmacy.']]], 422);
        }

        // If setting this as main, unset all other main branches first
        if (!empty($data['is_main'])) {
            Branch::where('pharmacy_id', $pharmacyId)
                ->where('is_main', true)
                ->update(['is_main' => false]);
        }

        $branch = Branch::create([
            'pharmacy_id' => $pharmacyId,
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_main' => !empty($data['is_main']),
        ]);

        $branch->loadCount(['users', 'sales', 'purchases']);

        return response()->json($branch, 201);
    }

    /**
     * Display the specified branch.
     */
    public function show(Branch $branch)
    {
        $branch->loadCount(['users', 'sales', 'purchases']);
        return response()->json($branch);
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, Branch $branch)
    {
        $authUser = $request->user();
        $pharmacyId = $branch->pharmacy_id;

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('branches')->where(function ($query) use ($pharmacyId) {
                    return $query->where('pharmacy_id', $pharmacyId);
                })->ignore($branch->id)
            ],
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|phone',
            'is_main' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // If setting this as main, unset all other main branches first
        if (!empty($data['is_main']) && !$branch->is_main) {
            Branch::where('pharmacy_id', $pharmacyId)
                ->where('is_main', true)
                ->update(['is_main' => false]);
        }

        // Prevent unsetting is_main if this is the only main branch
        if (isset($data['is_main']) && !$data['is_main'] && $branch->is_main) {
            return response()->json([
                'message' => 'Cannot unset main branch. Set another branch as main first.'
            ], 422);
        }

        $branch->update($data);
        $branch->loadCount(['users', 'sales', 'purchases']);

        return response()->json($branch);
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Branch $branch)
    {
        // Prevent deleting the main branch
        if ($branch->is_main) {
            return response()->json([
                'message' => 'Cannot delete the main branch. Assign another branch as main first.'
            ], 422);
        }

        // Prevent deletion if branch has associated users
        if ($branch->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch: it has assigned staff members. Reassign them first.'
            ], 422);
        }

        // Prevent deletion if branch has sales or purchases
        if ($branch->sales()->count() > 0 || $branch->purchases()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch: it has transaction history (sales/purchases).'
            ], 422);
        }

        $branch->delete();

        return response()->json(['success' => true]);
    }
}
