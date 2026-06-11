<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Subscriptions table - tracks pharmacy subscription lifecycle.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();
            $table->string('status', 30); // active, expired, cancelled
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->timestamp('trial_ends_at')->nullable();
            $table->string('payment_status', 30); // paid, due, failed
            $table->timestamps();

            $table->index('pharmacy_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
