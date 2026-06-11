<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sale Item Batches table - audit trail linking each sale item
     * to the specific batches from which stock was deducted (FEFO).
     * Critical for returns processing and batch-level reporting.
     */
    public function up(): void
    {
        Schema::create('sale_item_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('medicine_batches')->restrictOnDelete();
            $table->integer('quantity'); // Base units deducted from this specific batch
            $table->timestamp('created_at')->nullable();

            $table->index(['sale_item_id', 'batch_id'], 'idx_sale_item_batches_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_item_batches');
    }
};
