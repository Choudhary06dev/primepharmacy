<?php

namespace App\Models;

/**
 * Unit Model - Stock keeping units (e.g. Box, Strip, Tablet).
 */
class Unit extends TenantModel
{
    protected $fillable = [
        'pharmacy_id',
        'name',
        'abbreviation',
        'type',
        'description',
    ];
}
