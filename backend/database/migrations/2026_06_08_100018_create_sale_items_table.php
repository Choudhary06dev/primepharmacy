<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sale Items table - line items for each sale.
     * Stores both display-unit and base-unit quantities.
     */
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->integer('quantity');                    // Quantity in selected unit
            $table->decimal('unit_price', 12, 4);          // Sale price per selected unit
            $table->decimal('conversion_factor', 10, 4);
            $table->integer('base_quantity');               // quantity * conversion_factor
            $table->decimal('base_price', 12, 4);          // unit_price / conversion_factor
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
