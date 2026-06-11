<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supplier Returns table - returns sent back to suppliers.
     */
    public function up(): void
    {
        Schema::create('supplier_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('purchase_id')->constrained('purchases')->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->string('return_no', 100);
            $table->date('return_date');
            $table->decimal('grand_total', 12, 2);
            $table->decimal('refunded_amount', 12, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['pharmacy_id', 'return_no'], 'unique_pharmacy_sup_return_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_returns');
    }
};
