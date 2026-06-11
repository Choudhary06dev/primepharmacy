<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pharmacies table - the core tenant entity.
     * Every other business table references pharmacy_id for multi-tenant isolation.
     */
    public function up(): void
    {
        Schema::create('pharmacies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->string('logo', 255)->nullable();
            $table->string('domain', 255)->nullable()->unique();
            $table->string('status', 30)->default('trial'); // trial, active, suspended
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacies');
    }
};
