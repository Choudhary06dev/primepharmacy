<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ExpenseCategory Model - Expense classification categories.
 */
class ExpenseCategory extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'description',
    ];

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
