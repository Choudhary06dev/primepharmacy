<?php

namespace Database\Seeders;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset permissions team context for super admin
        if (config('permission.teams')) {
            setPermissionsTeamId(null);
        }

        // Create the global system roles
        $roles = ['Super Admin', 'Manager', 'Pharmacy Operator'];
        foreach ($roles as $roleName) {
            Role::query()->firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
                'pharmacy_id' => null, // Global
            ]);
        }

        // Create the global Super Admin user
        $user = User::firstOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'amjad123')),
                'pharmacy_id' => null,
                'branch_id' => null,
                'status' => 'active',
            ]
        );

        // Assign global role
        if (!$user->hasRole('Super Admin')) {
            $user->assignRole('Super Admin');
        }
    }
}
