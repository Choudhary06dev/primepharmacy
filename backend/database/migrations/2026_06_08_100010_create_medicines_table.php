<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Medicines table - core product catalog.
     * base_unit_id references the smallest unit (e.g., Tablet).
     * All stock quantities are tracked in this base unit.
     */
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('company_id')->constrained('companies')->restrictOnDelete();
            $table->string('name', 150);
            $table->string('generic_name', 150)->nullable();
            $table->string('sku', 100)->nullable();
            $table->string('barcode', 100)->nullable();
            $table->integer('min_stock_level')->default(0); // In base units
            $table->foreignId('base_unit_id')->constrained('units')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('pharmacy_id');
            $table->unique(['pharmacy_id', 'sku'], 'unique_pharmacy_sku');
            $table->unique(['pharmacy_id', 'barcode'], 'unique_pharmacy_barcode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
