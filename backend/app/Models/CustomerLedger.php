<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerLedger Model - Financial transaction audit trail for customers.
 */
class CustomerLedger extends TenantModel
{
    protected $table = 'customer_ledger';

    protected $fillable = [
        'pharmacy_id',
        'customer_id',
        'transaction_type',
        'transaction_id',
        'transaction_no',
        'debit',
        'credit',
        'running_balance',
        'transaction_date',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'running_balance' => 'decimal:2',
            'transaction_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
