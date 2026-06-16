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

            // 3. Create Default Tenant Roles in Spatie Permissions
            $roleNames = ['Owner', 'Pharmacist', 'Cashier', 'Manager', 'Stockist'];
            foreach ($roleNames as $roleName) {
                // Spatie team_foreign_key is 'pharmacy_id'
                Role::create([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'pharmacy_id' => $pharmacy->id,
                ]);
            }

            // Temporarily set the Spatie Team context to assign the role correctly
            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacy->id);
            }

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

                // 5. Assign Owner Role to the User
                $user->assignRole('Owner');
            }

            return [
                'pharmacy' => $pharmacy,
                'branch' => $branch,
                'user' => $user,
            ];
        });
    }
}
