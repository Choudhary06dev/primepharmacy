<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pharmacy Model - the core tenant entity.
 *
 * This is NOT a TenantModel because it IS the tenant.
 * All other business models reference this via pharmacy_id.
 */
class Pharmacy extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'domain',
        'status',
        'plan_id',
        'trial_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
        ];
    }

    // ──────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    /**
     * Check if the pharmacy is on an active trial.
     */
    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at?->isFuture();
    }

    /**
     * Check if the pharmacy subscription is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get the active subscription.
     */
    public function activeSubscription()
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->latest('starts_at')
            ->first();
    }
}
