<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic Plan',
                'slug' => 'basic',
                'price' => 29.99,
                'billing_cycle' => 'monthly',
                'max_branches' => 1,
                'max_users' => 3,
                'max_medicines' => 1000,
                'features' => [
                    'pos' => true,
                    'inventory' => true,
                    'reports' => false,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Professional Plan',
                'slug' => 'pro',
                'price' => 79.99,
                'billing_cycle' => 'monthly',
                'max_branches' => 3,
                'max_users' => 10,
                'max_medicines' => 5000,
                'features' => [
                    'pos' => true,
                    'inventory' => true,
                    'reports' => true,
                    'supplier_portal' => true,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise Plan',
                'slug' => 'enterprise',
                'price' => 199.99,
                'billing_cycle' => 'monthly',
                'max_branches' => 10,
                'max_users' => 50,
                'max_medicines' => 25000,
                'features' => [
                    'pos' => true,
                    'inventory' => true,
                    'reports' => true,
                    'supplier_portal' => true,
                    'multi_branch_sync' => true,
                    'api_access' => true,
                ],
                'is_active' => true,
            ]
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
