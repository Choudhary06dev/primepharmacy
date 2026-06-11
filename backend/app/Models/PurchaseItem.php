<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PurchaseItem Model - Line item inside an inventory purchase order.
 */
class PurchaseItem extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'purchase_id',
        'medicine_id',
        'unit_id',
        'quantity',
        'unit_price',
        'conversion_factor',
        'base_quantity',
        'base_price',
        'batch_no',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:4',
            'conversion_factor' => 'decimal:4',
            'base_quantity' => 'integer',
            'base_price' => 'decimal:4',
            'expiry_date' => 'date',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
