<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SupplierReturnItem Model - Line item in a supplier return transaction.
 */
class SupplierReturnItem extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'supplier_return_id',
        'purchase_item_id',
        'medicine_id',
        'unit_id',
        'quantity',
        'base_quantity',
        'refund_price',
        'batch_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'base_quantity' => 'integer',
            'refund_price' => 'decimal:4',
        ];
    }

    public function supplierReturn(): BelongsTo
    {
        return $this->belongsTo(SupplierReturn::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(MedicineBatch::class, 'batch_id');
    }
}
