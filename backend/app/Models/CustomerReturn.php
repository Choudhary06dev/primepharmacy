<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerReturn Model - Tracks products returned by customers.
 */
class CustomerReturn extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'sale_id',
        'customer_id',
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

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CustomerReturnItem::class);
    }
}
