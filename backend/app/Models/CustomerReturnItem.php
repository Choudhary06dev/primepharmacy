<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerReturnItem Model - Line item in a customer return transaction.
 */
class CustomerReturnItem extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'customer_return_id',
        'sale_item_id',
        'medicine_id',
        'unit_id',
        'quantity',
        'base_quantity',
        'refund_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'base_quantity' => 'integer',
            'refund_price' => 'decimal:4',
        ];
    }

    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
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
        return $this->hasMany(CustomerReturnBatch::class);
    }
}
