<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerReturnBatch Model - Links returned stock to specific medicine batches.
 */
class CustomerReturnBatch extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'customer_return_item_id',
        'batch_id',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function returnItem(): BelongsTo
    {
        return $this->belongsTo(CustomerReturnItem::class, 'customer_return_item_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(MedicineBatch::class, 'batch_id');
    }
}
