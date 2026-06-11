<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MedicineController extends Controller
{
    /**
     * Display a listing of medicines with category, company, base unit, conversions and aggregated stock.
     */
    public function index()
    {
        $medicines = Medicine::with(['category', 'company', 'baseUnit', 'conversions.fromUnit'])
            ->withSum('batches as total_stock', 'remaining_quantity')
            ->get();
            
        // Map to ensure total_stock is numeric and defaults to 0 if null
        $medicines->transform(function ($med) {
            $med->total_stock = (int) ($med->total_stock ?? 0);
            return $med;
        });

        return response()->json($medicines);
    }

    /**
     * Store a newly created medicine along with its unit conversions.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'company_id' => 'required|exists:companies,id',
            'name' => 'required|string|max:150',
            'generic_name' => 'nullable|string|max:150',
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('medicines')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('medicines')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'min_stock_level' => 'nullable|integer|min:0',
            'base_unit_id' => 'required|exists:units,id',
            'is_active' => 'nullable|boolean',
            'conversions' => 'nullable|array',
            'conversions.*.from_unit_id' => 'required|exists:units,id',
            'conversions.*.factor' => 'required|numeric|min:0.0001',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        DB::beginTransaction();
        try {
            $medicine = Medicine::create([
                'category_id' => $data['category_id'],
                'company_id' => $data['company_id'],
                'name' => $data['name'],
                'generic_name' => $data['generic_name'] ?? null,
                'sku' => $data['sku'] ?? 'SKU-' . time() . rand(10, 99),
                'barcode' => $data['barcode'] ?? null,
                'min_stock_level' => $data['min_stock_level'] ?? 0,
                'base_unit_id' => $data['base_unit_id'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (!empty($data['conversions'])) {
                foreach ($data['conversions'] as $conv) {
                    $medicine->conversions()->create([
                        'pharmacy_id' => auth()->user()->pharmacy_id,
                        'from_unit_id' => $conv['from_unit_id'],
                        'to_unit_id' => $medicine->base_unit_id,
                        'factor' => $conv['factor'],
                    ]);
                }
            }

            DB::commit();
            
            // Reload relationships
            $medicine->load(['category', 'company', 'baseUnit', 'conversions.fromUnit']);
            $medicine->total_stock = 0;

            return response()->json($medicine, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create medicine: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified medicine.
     */
    public function show(Medicine $medicine)
    {
        $medicine->load(['category', 'company', 'baseUnit', 'conversions.fromUnit']);
        $medicine->total_stock = (int) $medicine->batches()->sum('remaining_quantity');
        return response()->json($medicine);
    }

    /**
     * Update the specified medicine and sync its unit conversions.
     */
    public function update(Request $request, Medicine $medicine)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'company_id' => 'required|exists:companies,id',
            'name' => 'required|string|max:150',
            'generic_name' => 'nullable|string|max:150',
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('medicines')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($medicine->id)
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('medicines')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($medicine->id)
            ],
            'min_stock_level' => 'nullable|integer|min:0',
            'base_unit_id' => 'required|exists:units,id',
            'is_active' => 'nullable|boolean',
            'conversions' => 'nullable|array',
            'conversions.*.from_unit_id' => 'required|exists:units,id',
            'conversions.*.factor' => 'required|numeric|min:0.0001',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        DB::beginTransaction();
        try {
            $medicine->update([
                'category_id' => $data['category_id'],
                'company_id' => $data['company_id'],
                'name' => $data['name'],
                'generic_name' => $data['generic_name'] ?? null,
                'sku' => $data['sku'],
                'barcode' => $data['barcode'] ?? null,
                'min_stock_level' => $data['min_stock_level'] ?? 0,
                'base_unit_id' => $data['base_unit_id'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Sync unit conversions
            $medicine->conversions()->delete();
            if (!empty($data['conversions'])) {
                foreach ($data['conversions'] as $conv) {
                    $medicine->conversions()->create([
                        'pharmacy_id' => auth()->user()->pharmacy_id,
                        'from_unit_id' => $conv['from_unit_id'],
                        'to_unit_id' => $medicine->base_unit_id,
                        'factor' => $conv['factor'],
                    ]);
                }
            }

            DB::commit();

            // Reload relationships
            $medicine->load(['category', 'company', 'baseUnit', 'conversions.fromUnit']);
            $medicine->total_stock = (int) $medicine->batches()->sum('remaining_quantity');

            return response()->json($medicine);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update medicine: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified medicine from storage.
     */
    public function destroy(Medicine $medicine)
    {
        if ($medicine->batches()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete medicine: active stock batches are associated with it.'
            ], 422);
        }

        try {
            $medicine->conversions()->delete();
            $medicine->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Cannot delete medicine: it is referenced in billing sales or transaction logs.'
            ], 422);
        }
    }
}
