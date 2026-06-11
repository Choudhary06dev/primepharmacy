<?php

namespace Database\Seeders;

use App\Models\Pharmacy;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Company;
use App\Models\Unit;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\MedicineUnitConversion;
use Illuminate\Database\Seeder;

class InventoryDemoSeeder extends Seeder
{
    /**
     * Seed initial multi-tenant inventory for POS testing.
     */
    public function run(): void
    {
        $pharmacy = Pharmacy::first() ?? Pharmacy::create([
            'name' => 'Demo Pharmacy',
            'slug' => 'demo',
            'status' => 'trial',
        ]);

        $branch = Branch::first() ?? Branch::create([
            'pharmacy_id' => $pharmacy->id,
            'name' => 'Main Branch',
            'is_main' => true,
        ]);

        // Configure Spatie's Teams feature for the demo pharmacy
        if (config('permission.teams')) {
            setPermissionsTeamId((int) $pharmacy->id);
        }

        // Create tenant owner
        $owner = \App\Models\User::firstOrCreate(
            ['email' => 'owner@primepharm.com'],
            [
                'pharmacy_id' => $pharmacy->id,
                'branch_id' => $branch->id,
                'name' => 'Demo Owner',
                'password' => \Hash::make('password'),
                'status' => 'active',
            ]
        );

        // Assign Owner role
        \Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'Owner',
            'guard_name' => 'web',
            'pharmacy_id' => $pharmacy->id,
        ]);

        if (!$owner->hasRole('Owner')) {
            $owner->assignRole('Owner');
        }

        // Bind tenant context for belongsToTenant hooks
        app()->instance('tenant.id', $pharmacy->id);

        // Seed Categories
        $tabletCat = Category::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Tablets'], ['description' => 'Solid oral dosage forms']);
        $syrupCat = Category::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Syrups'], ['description' => 'Liquid oral dosage forms']);

        // Seed Companies
        $gsk = Company::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'GlaxoSmithKline'], ['email' => 'info@gsk.com', 'phone' => '021-111-475']);
        $pfizer = Company::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Pfizer'], ['email' => 'info@pfizer.com', 'phone' => '021-111-555']);

        // Seed Units
        $tabUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Tablet'], ['abbreviation' => 'TAB', 'type' => 'Base']);
        $stripUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Strip'], ['abbreviation' => 'STP', 'type' => 'Multiple', 'description' => 'Pack of 10 tablets']);
        $boxUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Box'], ['abbreviation' => 'BOX', 'type' => 'Multiple', 'description' => 'Pack of 100 tablets']);
        $bottleUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacy->id, 'name' => 'Bottle'], ['abbreviation' => 'BTL', 'type' => 'Base']);

        // Seed Medicines
        $amoxicillin = Medicine::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'sku' => 'SKU-AMX500'],
            [
                'category_id' => $tabletCat->id,
                'company_id' => $gsk->id,
                'name' => 'Amoxicillin 500mg',
                'generic_name' => 'Amoxicillin Trihydrate',
                'barcode' => '501234567890',
                'min_stock_level' => 50,
                'base_unit_id' => $tabUnit->id,
                'is_active' => true,
            ]
        );

        $panadol = Medicine::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'sku' => 'SKU-PAN500'],
            [
                'category_id' => $tabletCat->id,
                'company_id' => $pfizer->id,
                'name' => 'Panadol 500mg',
                'generic_name' => 'Paracetamol',
                'barcode' => '501234567891',
                'min_stock_level' => 100,
                'base_unit_id' => $tabUnit->id,
                'is_active' => true,
            ]
        );

        // Seed Unit Conversions
        MedicineUnitConversion::firstOrCreate([
            'pharmacy_id' => $pharmacy->id,
            'medicine_id' => $amoxicillin->id,
            'from_unit_id' => $stripUnit->id,
            'to_unit_id' => $tabUnit->id,
        ], ['factor' => 10]);

        MedicineUnitConversion::firstOrCreate([
            'pharmacy_id' => $pharmacy->id,
            'medicine_id' => $amoxicillin->id,
            'from_unit_id' => $boxUnit->id,
            'to_unit_id' => $tabUnit->id,
        ], ['factor' => 100]);

        MedicineUnitConversion::firstOrCreate([
            'pharmacy_id' => $pharmacy->id,
            'medicine_id' => $panadol->id,
            'from_unit_id' => $stripUnit->id,
            'to_unit_id' => $tabUnit->id,
        ], ['factor' => 10]);

        // Seed Batches (Amoxicillin)
        // Batch A: Expiring soon (FEFO index must pick this first)
        MedicineBatch::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'branch_id' => $branch->id, 'medicine_id' => $amoxicillin->id, 'batch_no' => 'AMX-001A'],
            [
                'expiry_date' => now()->addMonth()->toDateString(),
                'purchase_price' => 1.50,
                'sale_price' => 3.00,
                'quantity' => 150,
                'remaining_quantity' => 150,
                'status' => 'ACTIVE',
            ]
        );

        // Batch B: Expiring later
        MedicineBatch::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'branch_id' => $branch->id, 'medicine_id' => $amoxicillin->id, 'batch_no' => 'AMX-002B'],
            [
                'expiry_date' => now()->addMonths(6)->toDateString(),
                'purchase_price' => 1.50,
                'sale_price' => 3.00,
                'quantity' => 200,
                'remaining_quantity' => 200,
                'status' => 'ACTIVE',
            ]
        );

        // Seed Batches (Panadol)
        MedicineBatch::firstOrCreate(
            ['pharmacy_id' => $pharmacy->id, 'branch_id' => $branch->id, 'medicine_id' => $panadol->id, 'batch_no' => 'PAN-999'],
            [
                'expiry_date' => now()->addYear()->toDateString(),
                'purchase_price' => 0.50,
                'sale_price' => 1.00,
                'quantity' => 500,
                'remaining_quantity' => 500,
                'status' => 'ACTIVE',
            ]
        );
    }
}
