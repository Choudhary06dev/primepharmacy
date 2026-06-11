<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Sale Model - Customer invoice transactions.
 */
class Sale extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'customer_id',
        'user_id',
        'invoice_no',
        'sale_date',
        'sub_total',
        'tax',
        'discount',
        'grand_total',
        'paid_amount',
        'payment_status',
        'payment_method',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
}
