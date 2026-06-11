<?php

namespace App\Traits;

use App\Scopes\TenantScope;

/**
 * BelongsToTenant trait - apply to any model that requires pharmacy_id isolation.
 *
 * Responsibilities:
 * 1. Automatically applies TenantScope to filter queries by current pharmacy_id.
 * 2. Automatically sets pharmacy_id on new model creation.
 * 3. Prevents accidental cross-tenant data access.
 */
trait BelongsToTenant
{
    /**
     * Boot the trait.
     * Registers the TenantScope and a creating event to auto-set pharmacy_id.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Apply global scope to filter all queries
        static::addGlobalScope(new TenantScope);

        // Automatically set pharmacy_id when creating a new record
        static::creating(function ($model) {
            $pharmacyId = app()->bound('tenant.id') ? app('tenant.id') : null;

            if ($pharmacyId && !$model->pharmacy_id) {
                $model->pharmacy_id = $pharmacyId;
            }
        });
    }

    /**
     * Get the pharmacy that owns this record.
     */
    public function pharmacy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\Pharmacy::class);
    }
}
