<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supplier Return Items table - individual items returned to supplier.
     * batch_id tracks which batch's stock is decremented.
     */
    public function up(): void
    {
        Schema::create('supplier_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('supplier_return_id')->constrained('supplier_returns')->cascadeOnDelete();
            $table->foreignId('purchase_item_id')->constrained('purchase_items')->restrictOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->integer('quantity');
            $table->integer('base_quantity');
            $table->decimal('refund_price', 12, 4);
            $table->foreignId('batch_id')->constrained('medicine_batches')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_return_items');
    }
};
