<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Medicine Unit Conversions table.
     * Defines how larger units convert to the base unit.
     * Example: 1 Box = 100 Tablets (factor = 100), 1 Strip = 10 Tablets (factor = 10).
     * The 'to_unit_id' should typically be the medicine's base_unit_id.
     */
    public function up(): void
    {
        Schema::create('medicine_unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
            $table->foreignId('from_unit_id')->constrained('units')->restrictOnDelete();
            $table->foreignId('to_unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('factor', 10, 4); // e.g., 1 Box = 100 Tablets → factor = 100
            $table->timestamps();

            $table->unique(
                ['pharmacy_id', 'medicine_id', 'from_unit_id', 'to_unit_id'],
                'unique_medicine_conversion'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_unit_conversions');
    }
};
