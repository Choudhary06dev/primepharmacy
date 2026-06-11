<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer Return Batches table - links returned items
     * back to specific batches for stock restoration.
     */
    public function up(): void
    {
        Schema::create('customer_return_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('customer_return_item_id')->constrained('customer_return_items')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('medicine_batches')->restrictOnDelete();
            $table->integer('quantity'); // Base units returned to this batch
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_return_batches');
    }
};
