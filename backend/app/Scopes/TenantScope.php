<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TenantScope automatically filters all queries by the current tenant's pharmacy_id.
 * Applied globally to all models that use the BelongsToTenant trait.
 *
 * This ensures complete data isolation between pharmacies in the multi-tenant architecture.
 */
class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $pharmacyId = app()->bound('tenant.id') ? app('tenant.id') : null;

        if ($pharmacyId) {
            $builder->where($model->getTable() . '.pharmacy_id', $pharmacyId);
        }
    }
}
