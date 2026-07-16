<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Customer Model - Customers metadata and credit/debt balances.
 */
class Customer extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'phone',
        'email',
        'address',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CustomerLedger::class);
    }
}
