<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ActivityLog Model - Tracks user actions and system audits.
 */
class ActivityLog extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'user_id',
        'log_name',
        'description',
        'subject_id',
        'subject_type',
        'causer_id',
        'causer_type',
        'properties',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
