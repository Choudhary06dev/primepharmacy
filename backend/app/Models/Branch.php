<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Branch Model - Represents a pharmacy location/branch.
 */
class Branch extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'address',
        'phone',
        'is_main',
    ];

    protected function casts(): array
    {
        return [
            'is_main' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(MedicineBatch::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
