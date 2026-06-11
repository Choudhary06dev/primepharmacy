<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Medicine Batches table - tracks individual inventory batches.
     * Each purchase creates a new batch. Batches are never merged.
     * Stock is tracked in base units (remaining_quantity).
     * FEFO index: pharmacy_id + branch_id + medicine_id + status + expiry_date
     */
    public function up(): void
    {
        Schema::create('medicine_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
            $table->string('batch_no', 100);
            $table->date('expiry_date');
            $table->decimal('purchase_price', 12, 4); // Cost per base unit
            $table->decimal('sale_price', 12, 4);     // Retail price per base unit
            $table->integer('quantity');                // Initial base units
            $table->integer('remaining_quantity');      // Current base units remaining
            $table->string('status', 30)->default('ACTIVE'); // ACTIVE, OUT_OF_STOCK, EXPIRED
            $table->timestamps();

            // Composite index for FEFO batch selection during sales
            $table->index(
                ['pharmacy_id', 'branch_id', 'medicine_id', 'status', 'expiry_date'],
                'idx_batches_fefo'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_batches');
    }
};
