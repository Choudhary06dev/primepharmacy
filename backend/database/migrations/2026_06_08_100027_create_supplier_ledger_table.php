<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supplier Ledger table - full financial audit trail for supplier transactions.
     * Records every purchase, return, payment, and adjustment.
     * running_balance tracks the net amount owed to the supplier.
     */
    public function up(): void
    {
        Schema::create('supplier_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('transaction_type', 50); // PURCHASE, PURCHASE_RETURN, PAYMENT, CREDIT_NOTE, DEBIT_NOTE
            $table->unsignedBigInteger('transaction_id');
            $table->string('transaction_no', 100);
            $table->decimal('debit', 12, 2)->default(0.00);   // Payment/return (decreases balance)
            $table->decimal('credit', 12, 2)->default(0.00);  // Purchase (increases balance)
            $table->decimal('running_balance', 12, 2);
            $table->date('transaction_date');
            $table->timestamps();

            $table->index(['pharmacy_id', 'supplier_id', 'transaction_date'], 'idx_supplier_ledger_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_ledger');
    }
};
