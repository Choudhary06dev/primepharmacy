<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Plan Model - SaaS subscription plans (global, not tenant-scoped).
 */
class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price',
        'billing_cycle',
        'max_branches',
        'max_users',
        'max_medicines',
        'features',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function pharmacies()
    {
        return $this->hasMany(Pharmacy::class);
    }
}
