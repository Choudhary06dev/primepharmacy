<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Units table - measurement units (Box, Strip, Tablet, etc.) scoped per pharmacy.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('abbreviation', 10);
            $table->string('type', 20)->default('Base'); // Base, Multiple
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'name'], 'unique_pharmacy_unit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
