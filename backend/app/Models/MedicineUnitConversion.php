<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MedicineUnitConversion Model - Conversions from larger packaging units to base units.
 */
class MedicineUnitConversion extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'medicine_id',
        'from_unit_id',
        'to_unit_id',
        'factor',
    ];

    protected function casts(): array
    {
        return [
            'factor' => 'decimal:4',
        ];
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function fromUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    public function toUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }
}
