<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Branches table - each pharmacy can have multiple branches (locations).
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->boolean('is_main')->default(false);
            $table->timestamps();

            $table->index('pharmacy_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
