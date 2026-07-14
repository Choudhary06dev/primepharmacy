<?php

namespace App\Domains\SaaS\Services;

use App\Models\Pharmacy;
use App\Models\Branch;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantService
{
    /**
     * Register a new tenant (Pharmacy) along with default branch, roles, and owner user.
     *
     * @param array $data
     * @return array
     */
    public function registerTenant(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Create Pharmacy (Tenant)
            $status = $data['status'] ?? 'trial';
            $trialEndsAt = $status === 'trial' ? now()->addDays($data['trial_days'] ?? 30) : null;

            $pharmacy = Pharmacy::create([
                'name' => $data['pharmacy_name'],
                'slug' => Str::slug($data['pharmacy_slug'] ?? $data['pharmacy_name']),
                'status' => $status,
                'trial_ends_at' => $trialEndsAt,
            ]);

            // 2. Create Main Branch
            $branch = Branch::create([
                'pharmacy_id' => $pharmacy->id,
                'name' => 'Main Branch',
                'is_main' => true,
                'address' => $data['pharmacy_address'] ?? null,
                'phone' => $data['pharmacy_phone'] ?? null,
            ]);

            // Temporarily set the Spatie Team context to assign the role correctly
            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacy->id);
            }

            // 3. Create Default Tenant Roles in Spatie Permissions (inheriting global permissions)
            $roleNames = ['Manager', 'Pharmacy Operator'];
            foreach ($roleNames as $roleName) {
                $role = Role::query()->firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'pharmacy_id' => $pharmacy->id,
                ]);

                // Copy permissions from the global role of the same name if it exists
                $globalRole = Role::where('name', $roleName)
                    ->whereNull('pharmacy_id')
                    ->first();
                if ($globalRole) {
                    $role->syncPermissions($globalRole->permissions()->pluck('name')->toArray());
                }
            }

            // Pre-seed master Pakistani medicines database for the tenant
            $seeder = new \Database\Seeders\MasterMedicinesSeeder();
            $seeder->runForTenant($pharmacy->id);

            // 4. Create User (Owner) conditionally
            $user = null;
            if (!empty($data['email'])) {
                $user = User::create([
                    'pharmacy_id' => $pharmacy->id,
                    'branch_id' => $branch->id,
                    'name' => $data['name'] ?? 'Owner',
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'phone' => $data['phone'] ?? null,
                    'status' => 'active',
                ]);

                // 5. Assign Manager Role to the User
                $user->assignRole('Manager');
            }

            return [
                'pharmacy' => $pharmacy,
                'branch' => $branch,
                'user' => $user,
            ];
        });
    }
}
