<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Purchases table - purchase orders from suppliers.
     */
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->string('purchase_no', 100);
            $table->date('purchase_date');
            $table->decimal('sub_total', 12, 2);
            $table->decimal('tax', 12, 2)->default(0.00);
            $table->decimal('discount', 12, 2)->default(0.00);
            $table->decimal('grand_total', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0.00);
            $table->string('payment_status', 30); // PAID, PARTIALLY_PAID, DUE
            $table->string('payment_method', 50);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'purchase_no'], 'unique_pharmacy_purchase_no');
            $table->index(['pharmacy_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
