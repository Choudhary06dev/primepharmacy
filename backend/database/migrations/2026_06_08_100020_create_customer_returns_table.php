<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer Returns table - returns linked to original sales.
     */
    public function up(): void
    {
        Schema::create('customer_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('return_no', 100);
            $table->date('return_date');
            $table->decimal('grand_total', 12, 2);
            $table->decimal('refunded_amount', 12, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['pharmacy_id', 'return_no'], 'unique_pharmacy_cust_return_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_returns');
    }
};
