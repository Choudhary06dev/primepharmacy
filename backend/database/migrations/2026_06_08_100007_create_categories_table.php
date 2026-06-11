<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Categories table - medicine categories scoped per pharmacy.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'name'], 'unique_pharmacy_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
