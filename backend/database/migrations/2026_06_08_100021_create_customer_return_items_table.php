<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer Return Items table - individual items being returned.
     */
    public function up(): void
    {
        Schema::create('customer_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('customer_return_id')->constrained('customer_returns')->cascadeOnDelete();
            $table->foreignId('sale_item_id')->constrained('sale_items')->restrictOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->integer('quantity');
            $table->integer('base_quantity');
            $table->decimal('refund_price', 12, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_return_items');
    }
};
