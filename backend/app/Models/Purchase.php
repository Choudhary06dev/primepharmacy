<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Purchase Model - Records inventory purchase transactions.
 */
class Purchase extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'supplier_id',
        'purchase_no',
        'purchase_date',
        'sub_total',
        'tax',
        'discount',
        'grand_total',
        'paid_amount',
        'payment_status',
        'payment_method',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'sub_total' => 'decimal:2',
            'tax' => 'decimal:2',
            'discount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
