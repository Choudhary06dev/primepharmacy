<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Purchase Items table - line items for each purchase.
     * Stores both the user-entered unit quantity and the computed base quantity.
     * Each purchase item creates a corresponding medicine_batch.
     */
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->integer('quantity');                    // Entered quantity in selected unit
            $table->decimal('unit_price', 12, 4);          // Cost price per selected unit
            $table->decimal('conversion_factor', 10, 4);   // Conversion to base unit
            $table->integer('base_quantity');               // quantity * conversion_factor
            $table->decimal('base_price', 12, 4);          // unit_price / conversion_factor
            $table->string('batch_no', 100);
            $table->date('expiry_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
