<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Expense Model - Operating expenses recorded by branches.
 */
class Expense extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'expense_category_id',
        'amount',
        'expense_date',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
