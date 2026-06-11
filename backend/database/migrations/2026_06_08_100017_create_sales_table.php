<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sales table - sale/invoice records.
     * customer_id is nullable for walk-in customers.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete(); // Cashier
            $table->string('invoice_no', 100);
            $table->date('sale_date');
            $table->decimal('sub_total', 12, 2);
            $table->decimal('tax', 12, 2)->default(0.00);
            $table->decimal('discount', 12, 2)->default(0.00);
            $table->decimal('grand_total', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0.00);
            $table->string('payment_status', 30); // PAID, PARTIALLY_PAID, DUE
            $table->string('payment_method', 50);
            $table->timestamps();

            $table->unique(['pharmacy_id', 'invoice_no'], 'unique_pharmacy_invoice_no');
            $table->index(['pharmacy_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
