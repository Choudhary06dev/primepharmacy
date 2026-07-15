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

            // Pre-seed master Pakistani medicines database for the tenant
            $seeder = new \Database\Seeders\MasterMedicinesSeeder();
            $seeder->runForTenant($pharmacy->id);

            // 4. Create User (Owner) conditionally
            $user = null;
            if (!empty($data['email'])) {
                $emailPrefix = explode('@', $data['email'])[0];
                $username = strtolower(preg_replace('/[^a-zA-Z0-9_.]/', '', $emailPrefix));
                if (empty($username)) {
                    $username = 'owner_' . Str::random(5);
                }
                
                $original = $username;
                $counter = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $original . $counter;
                    $counter++;
                }

                $user = User::create([
                    'pharmacy_id' => $pharmacy->id,
                    'branch_id' => $branch->id,
                    'name' => $data['name'] ?? 'Owner',
                    'email' => $data['email'],
                    'username' => $username,
                    'password' => Hash::make($data['password']),
                    'phone' => $data['phone'] ?? null,
                    'status' => 'active',
                ]);

                // 5. Assign Manager Role to the User
                if (config('permission.teams')) {
                    setPermissionsTeamId((int) $pharmacy->id);
                }
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
