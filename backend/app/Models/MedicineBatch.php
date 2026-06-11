<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MedicineBatch Model - Tracks physical inventory batches with expiries.
 */
class MedicineBatch extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'medicine_id',
        'batch_no',
        'expiry_date',
        'purchase_price',
        'sale_price',
        'quantity',
        'remaining_quantity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'purchase_price' => 'decimal:4',
            'sale_price' => 'decimal:4',
            'quantity' => 'integer',
            'remaining_quantity' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
