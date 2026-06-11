<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Company Model - Medicine manufacturing companies.
 */
class Company extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'email',
        'phone',
    ];

    public function medicines(): HasMany
    {
        return $this->hasMany(Medicine::class);
    }
}
