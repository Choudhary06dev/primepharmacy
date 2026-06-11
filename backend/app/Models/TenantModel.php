<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

/**
 * TenantModel - base model for all tenant-scoped entities.
 *
 * Any model that contains pharmacy_id should extend this class
 * instead of the default Eloquent Model. This ensures:
 * - Automatic pharmacy_id filtering on all queries
 * - Automatic pharmacy_id assignment on creation
 * - Consistent relationship to the Pharmacy model
 */
abstract class TenantModel extends Model
{
    use BelongsToTenant;
}
