<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Unit;
use App\Models\Medicine;
use App\Models\MedicineUnitConversion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterMedicinesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (\App\Models\Pharmacy::all() as $pharmacy) {
            $this->runForTenant($pharmacy->id);
        }
    }

    /**
     * Run the seeder logic for a specific pharmacy tenant.
     *
     * @param int $pharmacyId
     * @return void
     */
    public function runForTenant(int $pharmacyId): void
    {
        // Temporarily bind tenant ID to context so BelongsToTenant hook is satisfied
        app()->instance('tenant.id', $pharmacyId);

        // 1. Seed Categories
        $categoriesMap = [];
        $categories = [
            'Tablets' => 'Solid oral dosage forms in pill shape',
            'Capsules' => 'Solid oral dosage forms in soluble shells',
            'Syrups' => 'Liquid oral dosage forms',
            'Suspensions' => 'Liquid oral dosage forms requiring shaking',
            'Injections' => 'Vials and ampoules for intravenous or intramuscular injection',
            'Ointments & Creams' => 'Topical semi-solid formulations for skin application',
            'Eye & Ear Drops' => 'Sterile liquid formulations for ophthalmic or otic use',
            'Inhalers & Sprays' => 'Aerosol formulations for respiratory administration',
            'Sachets' => 'Powder formulations packaged in individual bags',
        ];

        foreach ($categories as $name => $desc) {
            $cat = Category::firstOrCreate(
                ['pharmacy_id' => $pharmacyId, 'name' => $name],
                ['description' => $desc]
            );
            $categoriesMap[$name] = $cat->id;
        }

        // 2. Seed Companies (Manufacturers)
        $companiesMap = [];
        $companies = [
            'GlaxoSmithKline' => 'GSK Pakistan',
            'Abbott Laboratories' => 'Abbott Pakistan',
            'The Searle Company' => 'Searle Pakistan',
            'Getz Pharma' => 'Getz Pakistan',
            'Pfizer' => 'Pfizer Pakistan',
            'Martin Dow' => 'Martin Dow Pakistan',
            'Hilton Pharma' => 'Hilton Pakistan',
            'Sanofi-Aventis' => 'Sanofi Pakistan',
            'Ferozsons Laboratories' => 'Ferozsons Pakistan',
            'Bayer Pakistan' => 'Bayer Pakistan',
            'Reckitt Benckiser' => 'Reckitt Pakistan',
            'Novartis' => 'Novartis Pakistan',
            'Sami Pharmaceuticals' => 'Sami Pakistan',
            'High-Q Pharmaceuticals' => 'High-Q Pakistan',
            'Pharmevo' => 'Pharmevo Pakistan',
            'Bosch Pharmaceuticals' => 'Bosch Pakistan',
            'Herbion Pakistan' => 'Herbion Pakistan',
            'ICI Pakistan' => 'ICI Pakistan',
            'CCL Pharmaceuticals' => 'CCL Pakistan',
            'Zafa Pharmaceuticals' => 'Zafa Pakistan',
            'Wilson\'s Pharmaceuticals' => 'Wilsons Pakistan',
            'Platinum Pharmaceuticals' => 'Platinum Pakistan',
            'Atco Laboratories' => 'Atco Pakistan',
            'Genix Pharma' => 'Genix Pakistan',
            'Medisure Laboratories' => 'Medisure Pakistan',
            'Barrett Hodgson' => 'Barrett Hodgson Pakistan',
            'Brookes Pharma' => 'Brookes Pakistan',
            'Helix Pharma' => 'Helix Pakistan',
        ];

        foreach ($companies as $name => $desc) {
            $comp = Company::firstOrCreate(
                ['pharmacy_id' => $pharmacyId, 'name' => $name],
                ['email' => strtolower(str_replace([' ', '\''], '', $name)) . '@pharmacy-master.com', 'phone' => '021-111-555']
            );
            $companiesMap[$name] = $comp->id;
        }

        // 3. Seed Units
        $tabUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Tablet'], ['abbreviation' => 'TAB', 'type' => 'Base']);
        $capUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Capsule'], ['abbreviation' => 'CAP', 'type' => 'Base']);
        $btlUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Bottle'], ['abbreviation' => 'BTL', 'type' => 'Base']);
        $injUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Vial/Ampoule'], ['abbreviation' => 'INJ', 'type' => 'Base']);
        $tubUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Tube'], ['abbreviation' => 'TUB', 'type' => 'Base']);
        $sacUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Sachet'], ['abbreviation' => 'SAC', 'type' => 'Base']);

        // Multiples
        $stripUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Strip'], ['abbreviation' => 'STP', 'type' => 'Multiple', 'description' => 'Pack of 10 base units']);
        $boxUnit = Unit::firstOrCreate(['pharmacy_id' => $pharmacyId, 'name' => 'Box'], ['abbreviation' => 'BOX', 'type' => 'Multiple', 'description' => 'Pack of 100 base units']);

        $unitsMap = [
            'Tablet' => $tabUnit->id,
            'Capsule' => $capUnit->id,
            'Bottle' => $btlUnit->id,
            'Vial/Ampoule' => $injUnit->id,
            'Tube' => $tubUnit->id,
            'Sachet' => $sacUnit->id,
            'Strip' => $stripUnit->id,
            'Box' => $boxUnit->id,
        ];

        // 4. Core original medicines list
        $originalMedicines = [
            ['name' => 'Panadol 500mg', 'generic' => 'Paracetamol', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Panadol Extra', 'generic' => 'Paracetamol + Caffeine', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Panadol CF', 'generic' => 'Paracetamol + Pseudoephedrine', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Calpol Syrup 120mg/5ml', 'generic' => 'Paracetamol', 'cat' => 'Syrups', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Brufen 400mg', 'generic' => 'Ibuprofen', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Brufen DS Syrup 200mg/5ml', 'generic' => 'Ibuprofen', 'cat' => 'Syrups', 'comp' => 'Abbott Laboratories', 'unit' => 'Bottle'],
            ['name' => 'Augmentin 625mg', 'generic' => 'Co-Amoxiclav', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Augmentin 1g', 'generic' => 'Co-Amoxiclav', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Augmentin DS Suspension 156.25mg', 'generic' => 'Co-Amoxiclav', 'cat' => 'Suspensions', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Flagyl 400mg', 'generic' => 'Metronidazole', 'cat' => 'Tablets', 'comp' => 'Sanofi-Aventis', 'unit' => 'Tablet'],
            ['name' => 'Flagyl Suspension 200mg/5ml', 'generic' => 'Metronidazole', 'cat' => 'Suspensions', 'comp' => 'Sanofi-Aventis', 'unit' => 'Bottle'],
            ['name' => 'Disprin 300mg', 'generic' => 'Aspirin', 'cat' => 'Tablets', 'comp' => 'Reckitt Benckiser', 'unit' => 'Tablet'],
            ['name' => 'Loprin 75mg', 'generic' => 'Aspirin', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Solprin 300mg', 'generic' => 'Aspirin Soluble', 'cat' => 'Tablets', 'comp' => 'Reckitt Benckiser', 'unit' => 'Tablet'],
            ['name' => 'Ponstan 250mg', 'generic' => 'Mefenamic Acid', 'cat' => 'Tablets', 'comp' => 'Pfizer', 'unit' => 'Tablet'],
            ['name' => 'Ponstan Forte 500mg', 'generic' => 'Mefenamic Acid', 'cat' => 'Tablets', 'comp' => 'Pfizer', 'unit' => 'Tablet'],
            ['name' => 'Arinac Tablet', 'generic' => 'Ibuprofen + Pseudoephedrine', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Arinac Forte', 'generic' => 'Ibuprofen + Pseudoephedrine', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Avil 25mg', 'generic' => 'Pheniramine Maleate', 'cat' => 'Tablets', 'comp' => 'Sanofi-Aventis', 'unit' => 'Tablet'],
            ['name' => 'Avil Syrup', 'generic' => 'Pheniramine Maleate', 'cat' => 'Syrups', 'comp' => 'Sanofi-Aventis', 'unit' => 'Bottle'],
            ['name' => 'Softin 10mg', 'generic' => 'Loratadine', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Softin Syrup', 'generic' => 'Loratadine', 'cat' => 'Syrups', 'comp' => 'The Searle Company', 'unit' => 'Bottle'],
            ['name' => 'Zyrtec 10mg', 'generic' => 'Cetirizine Hydrochloride', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Zyrtec Syrup 5mg/5ml', 'generic' => 'Cetirizine Hydrochloride', 'cat' => 'Syrups', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Entamizole Tablet', 'generic' => 'Metronidazole + Diloxanide Furoate', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Entamizole DS Tablet', 'generic' => 'Metronidazole + Diloxanide Furoate', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Entamizole Suspension', 'generic' => 'Metronidazole + Diloxanide Furoate', 'cat' => 'Suspensions', 'comp' => 'Abbott Laboratories', 'unit' => 'Bottle'],
            ['name' => 'Ventolin Inhaler 100mcg', 'generic' => 'Salbutamol', 'cat' => 'Inhalers & Sprays', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Ventolin Syrup 2mg/5ml', 'generic' => 'Salbutamol', 'cat' => 'Syrups', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Ventolin Tablet 2mg', 'generic' => 'Salbutamol', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Novidat 250mg', 'generic' => 'Ciprofloxacin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Novidat 500mg', 'generic' => 'Ciprofloxacin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Ciproxin 500mg', 'generic' => 'Ciprofloxacin', 'cat' => 'Tablets', 'comp' => 'Bayer Pakistan', 'unit' => 'Tablet'],
            ['name' => 'Leflox 250mg', 'generic' => 'Levofloxacin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Leflox 500mg', 'generic' => 'Levofloxacin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Cranmax Sachet', 'generic' => 'Cranberry Extract', 'cat' => 'Sachets', 'comp' => 'The Searle Company', 'unit' => 'Sachet'],
            ['name' => 'Gravinate 50mg', 'generic' => 'Dimenhydrinate', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Gravinate Syrup', 'generic' => 'Dimenhydrinate', 'cat' => 'Syrups', 'comp' => 'The Searle Company', 'unit' => 'Bottle'],
            ['name' => 'Capoten 25mg', 'generic' => 'Captopril', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Capoten 50mg', 'generic' => 'Captopril', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Lipiget 10mg', 'generic' => 'Atorvastatin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Lipiget 20mg', 'generic' => 'Atorvastatin', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Concor 2.5mg', 'generic' => 'Bisoprolol Fumarate', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Concor 5mg', 'generic' => 'Bisoprolol Fumarate', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Glucophage 500mg', 'generic' => 'Metformin Hydrochloride', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Glucophage 850mg', 'generic' => 'Metformin Hydrochloride', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Glucophage 1000mg', 'generic' => 'Metformin Hydrochloride', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Getryl 1mg', 'generic' => 'Glimepiride', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Getryl 2mg', 'generic' => 'Glimepiride', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Getryl 3mg', 'generic' => 'Glimepiride', 'cat' => 'Tablets', 'comp' => 'Getz Pharma', 'unit' => 'Tablet'],
            ['name' => 'Diamicron 60mg MR', 'generic' => 'Gliclazide', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Voltral Emulgel 50g', 'generic' => 'Diclofenac Diethylamine', 'cat' => 'Ointments & Creams', 'comp' => 'Novartis', 'unit' => 'Tube'],
            ['name' => 'Voltral 50mg Tablet', 'generic' => 'Diclofenac Sodium', 'cat' => 'Tablets', 'comp' => 'Novartis', 'unit' => 'Tablet'],
            ['name' => 'Voltral SR 100mg', 'generic' => 'Diclofenac Sodium', 'cat' => 'Tablets', 'comp' => 'Novartis', 'unit' => 'Tablet'],
            ['name' => 'Voltral Injection 75mg', 'generic' => 'Diclofenac Sodium', 'cat' => 'Injections', 'comp' => 'Novartis', 'unit' => 'Vial/Ampoule'],
            ['name' => 'Somogel Mouth Gel', 'generic' => 'Lignocaine + Cetalkonium', 'cat' => 'Ointments & Creams', 'comp' => 'Abbott Laboratories', 'unit' => 'Tube'],
            ['name' => 'Betnovate Cream 20g', 'generic' => 'Betamethasone Valerate', 'cat' => 'Ointments & Creams', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tube'],
            ['name' => 'Betnovate-N Cream', 'generic' => 'Betamethasone + Neomycin', 'cat' => 'Ointments & Creams', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tube'],
            ['name' => 'Betnovate-C Cream', 'generic' => 'Betamethasone + Clioquinol', 'cat' => 'Ointments & Creams', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tube'],
            ['name' => 'Polyfax Skin Ointment 20g', 'generic' => 'Polymyxin B + Bacitracin', 'cat' => 'Ointments & Creams', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tube'],
            ['name' => 'Polyfax Eye Ointment 6g', 'generic' => 'Polymyxin B + Bacitracin', 'cat' => 'Ointments & Creams', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tube'],
            ['name' => 'Hydryllin Syrup 120ml', 'generic' => 'Aminophylline + Compound', 'cat' => 'Syrups', 'comp' => 'The Searle Company', 'unit' => 'Bottle'],
            ['name' => 'Hydryllin DM Syrup', 'generic' => 'Dextromethorphan + Compound', 'cat' => 'Syrups', 'comp' => 'The Searle Company', 'unit' => 'Bottle'],
            ['name' => 'Acefyl Syrup 120ml', 'generic' => 'Acefylline Piperazine', 'cat' => 'Syrups', 'comp' => 'The Searle Company', 'unit' => 'Bottle'],
            ['name' => 'Pulmonol Syrup 120ml', 'generic' => 'Cough expectorant formulation', 'cat' => 'Syrups', 'comp' => 'Martin Dow', 'unit' => 'Bottle'],
            ['name' => 'Gaviscon Liquid 150ml', 'generic' => 'Sodium Alginate + Compound', 'cat' => 'Suspensions', 'comp' => 'Reckitt Benckiser', 'unit' => 'Bottle'],
            ['name' => 'Mucaine Suspension 120ml', 'generic' => 'Oxetacaine in Antacid', 'cat' => 'Suspensions', 'comp' => 'Pfizer', 'unit' => 'Bottle'],
            ['name' => 'Risek 20mg Capsule', 'generic' => 'Omeprazole', 'cat' => 'Capsules', 'comp' => 'Getz Pharma', 'unit' => 'Capsule'],
            ['name' => 'Risek 40mg Capsule', 'generic' => 'Omeprazole', 'cat' => 'Capsules', 'comp' => 'Getz Pharma', 'unit' => 'Capsule'],
            ['name' => 'Risek Insta 20mg Sachet', 'generic' => 'Omeprazole + Sodium Bicarbonate', 'cat' => 'Sachets', 'comp' => 'Getz Pharma', 'unit' => 'Sachet'],
            ['name' => 'Risek Insta 40mg Sachet', 'generic' => 'Omeprazole + Sodium Bicarbonate', 'cat' => 'Sachets', 'comp' => 'Getz Pharma', 'unit' => 'Sachet'],
            ['name' => 'Sancos Syrup 120ml', 'generic' => 'Pholcodine + Compound', 'cat' => 'Syrups', 'comp' => 'Novartis', 'unit' => 'Bottle'],
            ['name' => 'Tusdec Syrup 120ml', 'generic' => 'Dextromethorphan + Pseudoephedrine', 'cat' => 'Syrups', 'comp' => 'Hilton Pharma', 'unit' => 'Bottle'],
            ['name' => 'Surbex-Z Tablet', 'generic' => 'Zinc + B-Complex + Vitamin C', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'CAC 1000 Plus 10s', 'generic' => 'Calcium + Vitamin C Effervescent', 'cat' => 'Tablets', 'comp' => 'GlaxoSmithKline', 'unit' => 'Tablet'],
            ['name' => 'Theragran-M Tablet', 'generic' => 'Multivitamins & Minerals', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Fefol Vit Capsule', 'generic' => 'Iron + Folic Acid + Vit C', 'cat' => 'Capsules', 'comp' => 'GlaxoSmithKline', 'unit' => 'Capsule'],
            ['name' => 'Sangobion Capsule', 'generic' => 'Iron + Vitamins & Minerals', 'cat' => 'Capsules', 'comp' => 'The Searle Company', 'unit' => 'Capsule'],
            ['name' => 'Neurobion Tablet', 'generic' => 'Vitamin B1 + B6 + B12', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Neurobion Injection 3ml', 'generic' => 'Vitamin B1 + B6 + B12', 'cat' => 'Injections', 'comp' => 'The Searle Company', 'unit' => 'Vial/Ampoule'],
            ['name' => 'Epival 250mg Tablet', 'generic' => 'Divalproex Sodium', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Epival 500mg Tablet', 'generic' => 'Divalproex Sodium', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Epival Chrono 500mg', 'generic' => 'Divalproex Sodium SR', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Tegral 200mg Tablet', 'generic' => 'Carbamazepine', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Tegral CR 200mg', 'generic' => 'Carbamazepine SR', 'cat' => 'Tablets', 'comp' => 'The Searle Company', 'unit' => 'Tablet'],
            ['name' => 'Rivotril 0.5mg Tablet', 'generic' => 'Clonazepam', 'cat' => 'Tablets', 'comp' => 'Martin Dow', 'unit' => 'Tablet'],
            ['name' => 'Rivotril 2mg Tablet', 'generic' => 'Clonazepam', 'cat' => 'Tablets', 'comp' => 'Martin Dow', 'unit' => 'Tablet'],
            ['name' => 'Xanax 0.25mg Tablet', 'generic' => 'Alprazolam', 'cat' => 'Tablets', 'comp' => 'Pfizer', 'unit' => 'Tablet'],
            ['name' => 'Xanax 0.5mg Tablet', 'generic' => 'Alprazolam', 'cat' => 'Tablets', 'comp' => 'Pfizer', 'unit' => 'Tablet'],
            ['name' => 'Lexotanil 3mg Tablet', 'generic' => 'Bromazepam', 'cat' => 'Tablets', 'comp' => 'Martin Dow', 'unit' => 'Tablet'],
            ['name' => 'Serc 8mg Tablet', 'generic' => 'Betahistine Dihydrochloride', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Serc 16mg Tablet', 'generic' => 'Betahistine Dihydrochloride', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Amoxil 250mg Capsule', 'generic' => 'Amoxicillin', 'cat' => 'Capsules', 'comp' => 'GlaxoSmithKline', 'unit' => 'Capsule'],
            ['name' => 'Amoxil 500mg Capsule', 'generic' => 'Amoxicillin', 'cat' => 'Capsules', 'comp' => 'GlaxoSmithKline', 'unit' => 'Capsule'],
            ['name' => 'Amoxil Syrup 125mg/5ml', 'generic' => 'Amoxicillin', 'cat' => 'Syrups', 'comp' => 'GlaxoSmithKline', 'unit' => 'Bottle'],
            ['name' => 'Voren 50mg Tablet', 'generic' => 'Diclofenac Sodium', 'cat' => 'Tablets', 'comp' => 'Abbott Laboratories', 'unit' => 'Tablet'],
            ['name' => 'Ceftriaxone 1g Injection', 'generic' => 'Ceftriaxone Sodium', 'cat' => 'Injections', 'comp' => 'Getz Pharma', 'unit' => 'Vial/Ampoule'],
            ['name' => 'Risek IV 40mg Injection', 'generic' => 'Omeprazole Sodium', 'cat' => 'Injections', 'comp' => 'Getz Pharma', 'unit' => 'Vial/Ampoule'],
            ['name' => 'Avil Injection 2ml', 'generic' => 'Pheniramine Maleate', 'cat' => 'Injections', 'comp' => 'Sanofi-Aventis', 'unit' => 'Vial/Ampoule'],
            ['name' => 'Gravinate Injection 1ml', 'generic' => 'Dimenhydrinate', 'cat' => 'Injections', 'comp' => 'The Searle Company', 'unit' => 'Vial/Ampoule'],
        ];

        // Ensure we collect all names to avoid duplicating them
        $usedNames = [];
        $medicinesToInsert = [];

        foreach ($originalMedicines as $index => $med) {
            $catId = $categoriesMap[$med['cat']];
            $compId = $companiesMap[$med['comp']];
            $unitId = $unitsMap[$med['unit']];

            $sku = 'SKU-' . strtoupper(substr(str_replace([' ', '\''], '', $med['comp']), 0, 3)) . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            $barcode = '501' . str_pad($pharmacyId, 2, '0', STR_PAD_LEFT) . str_pad($index + 1, 7, '0', STR_PAD_LEFT);

            $usedNames[strtolower($med['name'])] = 1;

            $medicinesToInsert[] = [
                'pharmacy_id' => $pharmacyId,
                'category_id' => $catId,
                'company_id' => $compId,
                'name' => $med['name'],
                'generic_name' => $med['generic'],
                'sku' => $sku,
                'barcode' => $barcode,
                'min_stock_level' => 50,
                'base_unit_id' => $unitId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 5. Generate realistic additional medicines up to 15,000
        $prefixes = [
            'Pan', 'Bru', 'Cal', 'Aug', 'Fla', 'Pon', 'Avi', 'Zyr', 'Nov', 'Lef', 'Cip', 'Gra', 'Cap', 'Lip', 'Con', 'Glu', 'Get', 'Dia', 'Vol', 'Bet', 'Pol', 'Hyd', 'Ace', 'Pul', 'Gav', 'Muc', 'Ris', 'San', 'Tus', 'Sur', 'Fef', 'Neu', 'Epi', 'Teg', 'Riv', 'Xan', 'Lex', 'Ser', 'Amo', 'Vor', 'Cef', 'Nex', 'Ros', 'Aml', 'Los', 'Val', 'Ena', 'Lis', 'Azi', 'Cla', 'Mon', 'Fex', 'Lev', 'Esom', 'Omep', 'Pant', 'Rabi', 'Sita', 'Vilda', 'Empa', 'Dapa', 'Lina', 'Piog', 'Met', 'Glib', 'Thyr', 'Carb', 'Phen', 'Valp', 'Leve', 'Lamo', 'Topi', 'Fluo', 'Esci', 'Sert', 'Cita', 'Paro', 'Amit', 'Olan', 'Risp', 'Quet', 'Halo', 'Arip', 'Meth', 'Done', 'Mema', 'Flut', 'Bude', 'Ipra', 'Tiot', 'Form', 'Salm', 'Mome', 'Clot', 'Mico', 'Keto', 'Terb', 'Itra', 'Fluc', 'Acyc', 'Sofo', 'Dacl', 'Riba', 'Teno', 'Ente', 'Arte', 'Lume', 'Chlo', 'Prim', 'Quin', 'Pyri', 'Meb', 'Albe', 'Iver', 'Perm', 'Benz', 'Sali', 'Clob', 'Fusi', 'Mupi', 'Lata', 'Timo', 'Brim', 'Dorz', 'Tobr', 'Moxi', 'Gati', 'Dext', 'Ring', 'Pota', 'Calc', 'Alu', 'Mag', 'Sucr', 'Bism', 'Lact', 'Lope', 'Mebe', 'Colo', 'Spas', 'Bus', 'Dut', 'Fina', 'Tams', 'Alfu', 'Sild', 'Tada', 'Var', 'Ator', 'Simv', 'Prav', 'Feno', 'Gem', 'Chol', 'Cole', 'Zeti', 'Ezet', 'Ali', 'Rep', 'Evol', 'Bemp', 'Icos', 'Omega', 'Vasp', 'Nia', 'Acip', 'Nexu'
        ];

        $suffixes = [
            'adol', 'fen', 'pol', 'mentin', 'gyl', 'stan', 'vil', 'tec', 'idat', 'flox', 'xin', 'inate', 'oten', 'iget', 'cor', 'phage', 'ryl', 'cron', 'tral', 'novate', 'fax', 'llin', 'fyl', 'nol', 'con', 'caine', 'sek', 'cos', 'dec', 'bex', 'bion', 'val', 'ral', 'ril', 'nax', 'tan', 'oxil', 'ren', 'one', 'sone', 'zole', 'statin', 'pril', 'artan', 'mycin', 'xime', 'dine', 'kast', 'dine', 'alin', 'pine', 'vir', 'quine', 'in', 'sol', 'cid', 'pro', 'drop', 'cap', 'tab', 'syr', 'susp', 'inj', 'gel', 'cream', 'oint', 'derm', 'plus', 'extra', 'fort', 'forte', 'ds', 'max', 'fast', 'slow', 'sr', 'xr', 'mr', 'la', 'od', 'bd', 'tds', 'qid', 'am', 'pm', 'day', 'night', 'cold', 'flu', 'cough', 'relief', 'active', 'care', 'soft', 'hard', 'dry', 'wet', 'clear', 'pure', 'gold', 'silver', 'bronze', 'platinum'
        ];

        $genericsData = [
            ['name' => 'Paracetamol', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['500mg', '650mg', '1g'], 'prefix' => 'Paramol'],
            ['name' => 'Paracetamol', 'cat' => 'Syrups', 'unit' => 'Bottle', 'strengths' => ['120mg/5ml', '250mg/5ml'], 'prefix' => 'CalpolDS'],
            ['name' => 'Ibuprofen', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['200mg', '400mg', '600mg'], 'prefix' => 'Ibufen'],
            ['name' => 'Ibuprofen', 'cat' => 'Syrups', 'unit' => 'Bottle', 'strengths' => ['100mg/5ml', '200mg/5ml'], 'prefix' => 'BrufenDS'],
            ['name' => 'Aspirin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['75mg', '150mg', '300mg'], 'prefix' => 'Asprin'],
            ['name' => 'Mefenamic Acid', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Mefnac'],
            ['name' => 'Metronidazole', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['200mg', '400mg'], 'prefix' => 'Metrogyl'],
            ['name' => 'Metronidazole', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['200mg/5ml'], 'prefix' => 'Metrozyl'],
            ['name' => 'Co-Amoxiclav', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['375mg', '625mg', '1g'], 'prefix' => 'Amoxiclav'],
            ['name' => 'Co-Amoxiclav', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['156.25mg', '312.5mg'], 'prefix' => 'Clavulon'],
            ['name' => 'Ciprofloxacin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg', '750mg'], 'prefix' => 'Ciprocyn'],
            ['name' => 'Levofloxacin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Levoflox'],
            ['name' => 'Amoxicillin', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Amox'],
            ['name' => 'Amoxicillin', 'cat' => 'Syrups', 'unit' => 'Bottle', 'strengths' => ['125mg/5ml', '250mg/5ml'], 'prefix' => 'AmoxSyr'],
            ['name' => 'Omeprazole', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['10mg', '20mg', '40mg'], 'prefix' => 'Omepra'],
            ['name' => 'Esomeprazole', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['20mg', '40mg'], 'prefix' => 'Esomax'],
            ['name' => 'Esomeprazole', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['20mg', '40mg'], 'prefix' => 'Esofast'],
            ['name' => 'Pantoprazole', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['20mg', '40mg'], 'prefix' => 'Pantocid'],
            ['name' => 'Rabeprazole', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '20mg'], 'prefix' => 'Rabeloc'],
            ['name' => 'Atorvastatin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '20mg', '40mg', '80mg'], 'prefix' => 'Atorva'],
            ['name' => 'Rosuvastatin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg', '20mg', '40mg'], 'prefix' => 'Rosuvas'],
            ['name' => 'Simvastatin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '20mg', '40mg'], 'prefix' => 'Simva'],
            ['name' => 'Amlodipine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['2.5mg', '5mg', '10mg'], 'prefix' => 'Amlocard'],
            ['name' => 'Valsartan', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['80mg', '160mg', '320mg'], 'prefix' => 'Valsar'],
            ['name' => 'Losartan', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['25mg', '50mg', '100mg'], 'prefix' => 'Losar'],
            ['name' => 'Enalapril', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg', '20mg'], 'prefix' => 'Enalap'],
            ['name' => 'Lisinopril', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg', '20mg'], 'prefix' => 'Lisinop'],
            ['name' => 'Azithromycin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Azithro'],
            ['name' => 'Azithromycin', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['200mg/5ml'], 'prefix' => 'AzithSyr'],
            ['name' => 'Clarithromycin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Claricin'],
            ['name' => 'Cefixime', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['400mg'], 'prefix' => 'Cefix'],
            ['name' => 'Cefixime', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['100mg/5ml', '200mg/5ml'], 'prefix' => 'CefixSyr'],
            ['name' => 'Cefuroxime', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['125mg', '250mg', '500mg'], 'prefix' => 'Cefurox'],
            ['name' => 'Cephradine', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Cephra'],
            ['name' => 'Cephradine', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['125mg/5ml', '250mg/5ml'], 'prefix' => 'CephraSyr'],
            ['name' => 'Secnidazole', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['500mg', '1g'], 'prefix' => 'Secnid'],
            ['name' => 'Domperidone', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg'], 'prefix' => 'Domper'],
            ['name' => 'Domperidone', 'cat' => 'Suspensions', 'unit' => 'Bottle', 'strengths' => ['5mg/5ml'], 'prefix' => 'Motilium'],
            ['name' => 'Ondansetron', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['4mg', '8mg'], 'prefix' => 'Ondaset'],
            ['name' => 'Montelukast', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['4mg', '5mg', '10mg'], 'prefix' => 'Montela'],
            ['name' => 'Montelukast', 'cat' => 'Sachets', 'unit' => 'Sachet', 'strengths' => ['4mg'], 'prefix' => 'MontelaSac'],
            ['name' => 'Fexofenadine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['60mg', '120mg', '180mg'], 'prefix' => 'Fexofed'],
            ['name' => 'Levocetirizine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg'], 'prefix' => 'Levocet'],
            ['name' => 'Cetirizine Hydrochloride', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg'], 'prefix' => 'Cetriz'],
            ['name' => 'Loratadine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg'], 'prefix' => 'Loradin'],
            ['name' => 'Salbutamol', 'cat' => 'Syrups', 'unit' => 'Bottle', 'strengths' => ['2mg/5ml'], 'prefix' => 'SalbutSyr'],
            ['name' => 'Salbutamol', 'cat' => 'Inhalers & Sprays', 'unit' => 'Bottle', 'strengths' => ['100mcg'], 'prefix' => 'SalbutInh'],
            ['name' => 'Alprazolam', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['0.25mg', '0.5mg', '1mg'], 'prefix' => 'Alpraz'],
            ['name' => 'Clonazepam', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['0.5mg', '1mg', '2mg'], 'prefix' => 'Clonap'],
            ['name' => 'Diazepam', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['2mg', '5mg', '10mg'], 'prefix' => 'Diaz'],
            ['name' => 'Pregabalin', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['50mg', '75mg', '150mg', '300mg'], 'prefix' => 'Pregab'],
            ['name' => 'Gabapentin', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['100mg', '300mg', '400mg'], 'prefix' => 'Gabap'],
            ['name' => 'Tramadol', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['50mg', '100mg'], 'prefix' => 'Tramal'],
            ['name' => 'Calcium + Vitamin D', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['500mg'], 'prefix' => 'Calcid'],
            ['name' => 'Multivitamins + Minerals', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['One-Daily'], 'prefix' => 'Multivit'],
            ['name' => 'Iron + Folic Acid', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['Standard'], 'prefix' => 'Ironfol'],
            ['name' => 'Ceftriaxone', 'cat' => 'Injections', 'unit' => 'Vial/Ampoule', 'strengths' => ['250mg', '500mg', '1g'], 'prefix' => 'Ceftria'],
            ['name' => 'Cefotaxime', 'cat' => 'Injections', 'unit' => 'Vial/Ampoule', 'strengths' => ['250mg', '500mg', '1g'], 'prefix' => 'Cefotax'],
            ['name' => 'Diclofenac Sodium', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['50mg', '100mg'], 'prefix' => 'Diclor'],
            ['name' => 'Diclofenac Sodium', 'cat' => 'Injections', 'unit' => 'Vial/Ampoule', 'strengths' => ['75mg/3ml'], 'prefix' => 'DiclorInj'],
            ['name' => 'Clotrimazole', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['1% 20g', '1% 50g'], 'prefix' => 'Clotridern'],
            ['name' => 'Miconazole', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['2% 20g'], 'prefix' => 'Micona'],
            ['name' => 'Fusidic Acid', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['2% 15g'], 'prefix' => 'Fucicort'],
            ['name' => 'Betamethasone', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['0.1% 15g'], 'prefix' => 'BetnovateG'],
            ['name' => 'Hydrocortisone', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['1% 10g'], 'prefix' => 'Hydrocort'],
            ['name' => 'Tobramycin', 'cat' => 'Eye & Ear Drops', 'unit' => 'Bottle', 'strengths' => ['0.3% 5ml'], 'prefix' => 'TobraEye'],
            ['name' => 'Moxifloxacin', 'cat' => 'Eye & Ear Drops', 'unit' => 'Bottle', 'strengths' => ['0.5% 5ml'], 'prefix' => 'MoxieEye'],
            ['name' => 'Timolol Maleate', 'cat' => 'Eye & Ear Drops', 'unit' => 'Bottle', 'strengths' => ['0.5% 5ml'], 'prefix' => 'TimoDrop'],
            ['name' => 'Fluticasone Propionate', 'cat' => 'Inhalers & Sprays', 'unit' => 'Bottle', 'strengths' => ['50mcg', '125mcg', '250mcg'], 'prefix' => 'Flutinas'],
            ['name' => 'Budesonide', 'cat' => 'Inhalers & Sprays', 'unit' => 'Bottle', 'strengths' => ['100mcg', '200mcg'], 'prefix' => 'Budecort'],
            ['name' => 'Cranberry Extract', 'cat' => 'Sachets', 'unit' => 'Sachet', 'strengths' => ['500mg'], 'prefix' => 'CranSachet'],
            ['name' => 'Sildenafil', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['50mg', '100mg'], 'prefix' => 'Sildena'],
            ['name' => 'Tadalafil', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '20mg'], 'prefix' => 'Tadala'],
            ['name' => 'Sitagliptin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['25mg', '50mg', '100mg'], 'prefix' => 'Sitaget'],
            ['name' => 'Vildagliptin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['50mg'], 'prefix' => 'Vildaglip'],
            ['name' => 'Linagliptin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg'], 'prefix' => 'Linagip'],
            ['name' => 'Empagliflozin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '25mg'], 'prefix' => 'Jardian'],
            ['name' => 'Dapagliflozin', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg'], 'prefix' => 'Dapazin'],
            ['name' => 'Pioglitazone', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['15mg', '30mg', '45mg'], 'prefix' => 'Pioglit'],
            ['name' => 'Spironolactone', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['25mg', '100mg'], 'prefix' => 'Aldoctone'],
            ['name' => 'Furosemide', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['40mg'], 'prefix' => 'Lasix'],
            ['name' => 'Thyroxine Sodium', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['50mcg', '100mcg'], 'prefix' => 'Thyrox'],
            ['name' => 'Carbamazepine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['200mg'], 'prefix' => 'Carbama'],
            ['name' => 'Sodium Valproate', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg'], 'prefix' => 'Valpro'],
            ['name' => 'Levetiracetam', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['250mg', '500mg', '1g'], 'prefix' => 'KeppraX'],
            ['name' => 'Fluoxetine', 'cat' => 'Capsules', 'unit' => 'Capsule', 'strengths' => ['20mg'], 'prefix' => 'ProzacX'],
            ['name' => 'Escitalopram', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg', '20mg'], 'prefix' => 'Escita'],
            ['name' => 'Sertraline', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['50mg', '100mg'], 'prefix' => 'Sertra'],
            ['name' => 'Amitriptyline', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '25mg', '50mg'], 'prefix' => 'Amitrip'],
            ['name' => 'Olanzapine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg'], 'prefix' => 'Olanza'],
            ['name' => 'Risperidone', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['1mg', '2mg', '3mg', '4mg'], 'prefix' => 'Risper'],
            ['name' => 'Quetiapine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['25mg', '100mg', '200mg'], 'prefix' => 'Quetia'],
            ['name' => 'Donepezil', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['5mg', '10mg'], 'prefix' => 'Donep'],
            ['name' => 'Memantine', 'cat' => 'Tablets', 'unit' => 'Tablet', 'strengths' => ['10mg', '20mg'], 'prefix' => 'Meman'],
            ['name' => 'Terbinafine', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['1% 15g'], 'prefix' => 'Terbina'],
            ['name' => 'Ketoconazole', 'cat' => 'Ointments & Creams', 'unit' => 'Tube', 'strengths' => ['2% 15g'], 'prefix' => 'Ketoderm'],
            ['name' => 'Latanoprost', 'cat' => 'Eye & Ear Drops', 'unit' => 'Bottle', 'strengths' => ['0.005% 2.5ml'], 'prefix' => 'LatanEye'],
            ['name' => 'Brimonidine', 'cat' => 'Eye & Ear Drops', 'unit' => 'Bottle', 'strengths' => ['0.2% 5ml'], 'prefix' => 'BrimonEye'],
        ];

        $companyNames = array_keys($companies);

        $totalTarget = 15000;
        $originalCount = count($originalMedicines);
        $additionalNeed = $totalTarget - $originalCount;

        for ($i = 0; $i < $additionalNeed; $i++) {
            $generic = $genericsData[$i % count($genericsData)];
            $company = $companyNames[($i * 3) % count($companyNames)];
            $strength = $generic['strengths'][$i % count($generic['strengths'])];

            // Build realistic brand name
            $prefix = $prefixes[$i % count($prefixes)];
            $suffix = $suffixes[($i * 7) % count($suffixes)];
            $brandRoot = ucfirst($prefix . $suffix);
            $baseName = $brandRoot . ' ' . $strength;

            // Ensure uniqueness
            $nameKey = strtolower($baseName);
            if (isset($usedNames[$nameKey])) {
                $usedNames[$nameKey]++;
                $baseName .= ' ' . chr(64 + $usedNames[$nameKey]);
            } else {
                $usedNames[$nameKey] = 1;
            }

            $catId = $categoriesMap[$generic['cat']];
            $compId = $companiesMap[$company];
            $unitId = $unitsMap[$generic['unit']];

            // Generate unique SKU & Barcode based on the offset $originalCount
            $skuIndex = $originalCount + $i + 1;
            $sku = 'SKU-' . strtoupper(substr(str_replace([' ', '\''], '', $company), 0, 3)) . '-' . str_pad($skuIndex, 6, '0', STR_PAD_LEFT);
            $barcode = '501' . str_pad($pharmacyId, 2, '0', STR_PAD_LEFT) . str_pad($skuIndex, 7, '0', STR_PAD_LEFT);

            $medicinesToInsert[] = [
                'pharmacy_id' => $pharmacyId,
                'category_id' => $catId,
                'company_id' => $compId,
                'name' => $baseName,
                'generic_name' => $generic['name'],
                'sku' => $sku,
                'barcode' => $barcode,
                'min_stock_level' => 50,
                'base_unit_id' => $unitId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 6. Bulk insert medicines in chunks of 1000
        $chunks = array_chunk($medicinesToInsert, 1000);
        foreach ($chunks as $chunk) {
            DB::table('medicines')->insertOrIgnore($chunk);
        }

        // 7. Seed unit conversions for solid forms (Tablets & Capsules)
        // Fetch all inserted medicines to map them by SKU and get their DB IDs
        $dbMedicines = DB::table('medicines')
            ->where('pharmacy_id', $pharmacyId)
            ->select('id', 'sku', 'base_unit_id')
            ->get()
            ->keyBy('sku');

        $tabUnitId = $unitsMap['Tablet'];
        $capUnitId = $unitsMap['Capsule'];
        $stripUnitId = $unitsMap['Strip'];
        $boxUnitId = $unitsMap['Box'];

        $conversionsToInsert = [];

        foreach ($medicinesToInsert as $med) {
            $dbMed = $dbMedicines->get($med['sku']);
            if (!$dbMed) {
                continue;
            }

            if ($dbMed->base_unit_id === $tabUnitId || $dbMed->base_unit_id === $capUnitId) {
                // Strip Conversion (Factor 10)
                $conversionsToInsert[] = [
                    'pharmacy_id' => $pharmacyId,
                    'medicine_id' => $dbMed->id,
                    'from_unit_id' => $stripUnitId,
                    'to_unit_id' => $dbMed->base_unit_id,
                    'factor' => 10,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Box Conversion (Factor 100)
                $conversionsToInsert[] = [
                    'pharmacy_id' => $pharmacyId,
                    'medicine_id' => $dbMed->id,
                    'from_unit_id' => $boxUnitId,
                    'to_unit_id' => $dbMed->base_unit_id,
                    'factor' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Bulk insert conversions in chunks of 1000
        $conversionChunks = array_chunk($conversionsToInsert, 1000);
        foreach ($conversionChunks as $chunk) {
            DB::table('medicine_unit_conversions')->insertOrIgnore($chunk);
        }
    }
}
