<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SaleItemBatch Model - Links specific batches to a sale line item.
 */
class SaleItemBatch extends TenantModel
{
    const UPDATED_AT = null;

    protected $fillable = [
        'pharmacy_id',
        'sale_item_id',
        'batch_id',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(MedicineBatch::class, 'batch_id');
    }
}
