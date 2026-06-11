<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Activity Logs table - comprehensive audit trail for all system actions.
     * Tracks who did what, when, and to which record.
     * Uses JSONB properties for flexible before/after state snapshots.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('log_name', 100);
            $table->text('description');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('causer_id')->nullable();
            $table->string('causer_type')->nullable();
            $table->jsonb('properties')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['pharmacy_id', 'log_name', 'created_at'], 'idx_activity_logs_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
