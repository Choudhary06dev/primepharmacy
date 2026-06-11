<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SupplierLedger Model - Financial transaction audit trail for suppliers.
 */
class SupplierLedger extends TenantModel
{
    protected $table = 'supplier_ledger';

    protected $fillable = [
        'pharmacy_id',
        'supplier_id',
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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
