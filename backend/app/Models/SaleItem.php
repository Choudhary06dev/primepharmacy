<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * SaleItem Model - Line item within a sale transaction.
 */
class SaleItem extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'sale_id',
        'medicine_id',
        'unit_id',
        'quantity',
        'unit_price',
        'conversion_factor',
        'base_quantity',
        'base_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:4',
            'conversion_factor' => 'decimal:4',
            'base_quantity' => 'integer',
            'base_price' => 'decimal:4',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(SaleItemBatch::class);
    }
}
