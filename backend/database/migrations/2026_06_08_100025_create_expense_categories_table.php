<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expense Categories table - categories for pharmacy expenses.
     */
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'name'], 'unique_pharmacy_expense_cat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
