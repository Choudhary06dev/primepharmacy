<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Medicine Model - Inventory items catalog.
 */
class Medicine extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'category_id',
        'company_id',
        'name',
        'generic_name',
        'sku',
        'barcode',
        'min_stock_level',
        'base_unit_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_stock_level' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function conversions(): HasMany
    {
        return $this->hasMany(MedicineUnitConversion::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(MedicineBatch::class);
    }
}
