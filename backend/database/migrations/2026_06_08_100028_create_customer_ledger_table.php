<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer Ledger table - full financial audit trail for customer transactions.
     * Records every sale, return, payment, and adjustment.
     * running_balance tracks the net amount customer owes.
     */
    public function up(): void
    {
        Schema::create('customer_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('transaction_type', 50); // SALE, SALE_RETURN, PAYMENT, CREDIT_NOTE, DEBIT_NOTE
            $table->unsignedBigInteger('transaction_id');
            $table->string('transaction_no', 100);
            $table->decimal('debit', 12, 2)->default(0.00);   // Sale (increases customer debt)
            $table->decimal('credit', 12, 2)->default(0.00);  // Payment/return (decreases debt)
            $table->decimal('running_balance', 12, 2);
            $table->date('transaction_date');
            $table->timestamps();

            $table->index(['pharmacy_id', 'customer_id', 'transaction_date'], 'idx_customer_ledger_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_ledger');
    }
};
