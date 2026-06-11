<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expenses table - operational expenses per branch.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->restrictOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('expense_date');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'branch_id', 'expense_date'], 'idx_expenses_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
