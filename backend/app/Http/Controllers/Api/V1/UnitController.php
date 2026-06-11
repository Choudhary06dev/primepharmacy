<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    /**
     * Display a listing of units.
     */
    public function index()
    {
        $units = Unit::all();
        return response()->json($units);
    }

    /**
     * Store a newly created unit.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'abbreviation' => [
                'required',
                'string',
                'max:10',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })
            ],
            'type' => ['required', Rule::in(['Base', 'Multiple'])],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $unit = Unit::create($validator->validated());

        return response()->json($unit, 201);
    }

    /**
     * Display the specified unit.
     */
    public function show(Unit $unit)
    {
        return response()->json($unit);
    }

    /**
     * Update the specified unit.
     */
    public function update(Request $request, Unit $unit)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($unit->id)
            ],
            'abbreviation' => [
                'required',
                'string',
                'max:10',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('pharmacy_id', auth()->user()->pharmacy_id);
                })->ignore($unit->id)
            ],
            'type' => ['required', Rule::in(['Base', 'Multiple'])],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $unit->update($validator->validated());

        return response()->json($unit);
    }

    /**
     * Remove the specified unit.
     */
    public function destroy(Unit $unit)
    {
        try {
            $unit->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Cannot delete unit: it is currently in use in medicines or unit conversions.'
            ], 422);
        }
    }
}
