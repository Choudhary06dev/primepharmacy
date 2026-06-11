<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SaaS Plans table - defines subscription tiers.
     * This is a global table (no pharmacy_id) since plans are system-wide.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('billing_cycle', 20)->default('monthly'); // monthly, yearly
            $table->integer('max_branches')->default(1);
            $table->integer('max_users')->default(3);
            $table->integer('max_medicines')->default(500);
            $table->jsonb('features')->nullable(); // Flexible feature flags
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
