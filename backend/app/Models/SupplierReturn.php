<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * SupplierReturn Model - Records products returned to suppliers.
 */
class SupplierReturn extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'purchase_id',
        'supplier_id',
        'return_no',
        'return_date',
        'grand_total',
        'refunded_amount',
    ];

    protected function casts(): array
    {
        return [
            'return_date' => 'date',
            'grand_total' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierReturnItem::class);
    }
}
