<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Supplier Model - Suppliers metadata and balance tracking.
 */
class Supplier extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'contact_person',
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

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(SupplierLedger::class);
    }
}
