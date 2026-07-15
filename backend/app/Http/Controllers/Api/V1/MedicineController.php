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
    public function index(Request $request)
    {
        // Resolve the active branch ID context
        $branchId = null;
        if (auth()->check()) {
            $user = auth()->user();
            if ($user->pharmacy_id !== null && $user->branch_id !== null) {
                $userBranch = $user->branch;
                if ($userBranch && !$userBranch->is_main) {
                    // Sub-branch user: locked to their own branch
                    $branchId = $user->branch_id;
                } else {
                    // Main branch user: allow optional ?branch_id filter
                    $requestedBranchId = $request->query('branch_id');
                    if ($requestedBranchId && is_numeric($requestedBranchId)) {
                        $branchId = (int) $requestedBranchId;
                    }
                }
            }
        }

        // Return highly optimized lightweight list for dropdowns/selectors
        if ($request->query('simple') === 'true' || $request->boolean('simple')) {
            $pharmacyId = app()->bound('tenant.id') ? app('tenant.id') : null;
            
            $query = DB::table('medicines')
                ->leftJoin('units', 'medicines.base_unit_id', '=', 'units.id')
                ->leftJoin('medicine_batches', function ($join) use ($branchId) {
                    $join->on('medicines.id', '=', 'medicine_batches.medicine_id')
                         ->where('medicine_batches.status', '=', 'ACTIVE')
                         ->where('medicine_batches.remaining_quantity', '>', 0);
                    if ($branchId) {
                        $join->where('medicine_batches.branch_id', '=', $branchId);
                    }
                })
                ->select([
                    'medicines.id',
                    'medicines.name',
                    'medicines.generic_name',
                    'medicines.sku',
                    'medicines.barcode',
                    'medicines.is_active',
                    'medicines.base_unit_id',
                    'units.name as base_unit_name',
                    'units.abbreviation as base_unit_abbreviation',
                    DB::raw('COALESCE(SUM(medicine_batches.remaining_quantity), 0) as total_stock')
                ])
                ->groupBy([
                    'medicines.id',
                    'medicines.name',
                    'medicines.generic_name',
                    'medicines.sku',
                    'medicines.barcode',
                    'medicines.is_active',
                    'medicines.base_unit_id',
                    'units.name',
                    'units.abbreviation'
                ])
                ->orderBy('medicines.name', 'asc');

            if ($pharmacyId) {
                $query->where('medicines.pharmacy_id', $pharmacyId);
            }

            if ($request->filled('search')) {
                $search = strtolower($request->query('search'));
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(medicines.name) like ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(medicines.generic_name) like ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(medicines.sku) like ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(medicines.barcode) like ?', ["%{$search}%"]);
                });
            }

            $medicines = $query->limit(50)->get();
            
            $medicines->transform(function ($med) {
                $med->base_unit = [
                    'id' => $med->base_unit_id,
                    'name' => $med->base_unit_name,
                    'abbreviation' => $med->base_unit_abbreviation
                ];
                $med->base_unit_id = (int)$med->base_unit_id;
                $med->id = (int)$med->id;
                $med->is_active = (bool)$med->is_active;
                $med->total_stock = (int)$med->total_stock;
                unset($med->base_unit_name);
                unset($med->base_unit_abbreviation);
                return $med;
            });
            return response()->json($medicines);
        }

        $query = Medicine::with([
            'category', 
            'company', 
            'baseUnit', 
            'conversions.fromUnit',
            'batches' => function ($q) {
                $q->where('status', 'ACTIVE')
                  ->where('remaining_quantity', '>', 0)
                  ->orderBy('expiry_date', 'asc');
            }
        ])
        ->withSum('batches as total_stock', 'remaining_quantity');

        // Apply backend search filter (case-insensitive)
        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) like ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(generic_name) like ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(sku) like ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(barcode) like ?', ["%{$search}%"]);
            });
        }

        // Return unpaginated array if explicitly requested or page is not specified
        if ($request->query('paginate') === 'false' || !$request->has('page')) {
            $medicines = $query->orderBy('name', 'asc')->get();
            $medicines->transform(function ($med) {
                $med->total_stock = (int) ($med->total_stock ?? 0);
                return $med;
            });
            return response()->json($medicines);
        }

        $perPage = $request->query('per_page', 25);
        $paginator = $query->orderBy('name', 'asc')->paginate($perPage);

        // Map to ensure total_stock is numeric and defaults to 0 if null
        $paginator->getCollection()->transform(function ($med) {
            $med->total_stock = (int) ($med->total_stock ?? 0);
            return $med;
        });

        return response()->json($paginator);
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
            $medicine->load([
                'category', 
                'company', 
                'baseUnit', 
                'conversions.fromUnit',
                'batches' => function ($query) {
                    $query->where('status', 'ACTIVE')
                          ->where('remaining_quantity', '>', 0)
                          ->orderBy('expiry_date', 'asc');
                }
            ]);
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
        $medicine->load([
            'category', 
            'company', 
            'baseUnit', 
            'conversions.fromUnit',
            'batches' => function ($query) {
                $query->where('status', 'ACTIVE')
                      ->where('remaining_quantity', '>', 0)
                      ->orderBy('expiry_date', 'asc');
            }
        ]);
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
                'nullable',
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
                'sku' => $data['sku'] ?? $medicine->sku ?? 'SKU-' . time() . rand(10, 99),
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
            $medicine->load([
                'category', 
                'company', 
                'baseUnit', 
                'conversions.fromUnit',
                'batches' => function ($query) {
                    $query->where('status', 'ACTIVE')
                          ->where('remaining_quantity', '>', 0)
                          ->orderBy('expiry_date', 'asc');
                }
            ]);
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
