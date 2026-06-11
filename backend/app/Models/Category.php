<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Category Model - Medicine categories.
 */
class Category extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'description',
    ];

    public function medicines(): HasMany
    {
        return $this->hasMany(Medicine::class);
    }
}
