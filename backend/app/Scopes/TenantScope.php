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
    public function apply(Builder $builder, Model $model): void
    {
        $pharmacyId = null;

        // 1. Resolve pharmacy ID context
        if (app()->bound('tenant.id') && app('tenant.id') !== null) {
            $pharmacyId = app('tenant.id');
        } elseif (auth()->check()) {
            $pharmacyId = auth()->user()->pharmacy_id;
        }

        if ($pharmacyId !== null) {
            $builder->where($model->getTable() . '.pharmacy_id', $pharmacyId);
        } else {
            // Super Admin in global panel
            if (auth()->check()) {
                if (!($model instanceof \App\Models\User || $model instanceof \Spatie\Permission\Models\Role || $model instanceof \App\Models\Branch)) {
                    $builder->where($model->getTable() . '.pharmacy_id', -1);
                }
            }
        }

        // 2. Branch Isolation
        if (auth()->check() && in_array('branch_id', $model->getFillable())) {
            $user = auth()->user();
            if ($user->pharmacy_id !== null && $user->branch_id !== null) {
                $userBranch = $user->branch;
                if ($userBranch && !$userBranch->is_main) {
                    // Sub-branch user: always restricted to their own branch
                    $builder->where($model->getTable() . '.branch_id', $user->branch_id);
                } else {
                    // Main branch user: allow optional ?branch_id filter for cross-branch viewing
                    $requestedBranchId = request()?->query('branch_id');
                    if ($requestedBranchId && is_numeric($requestedBranchId)) {
                        $builder->where($model->getTable() . '.branch_id', (int) $requestedBranchId);
                    }
                }
            }
        }
    }
}
