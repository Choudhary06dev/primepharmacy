<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;

// Mock login as Super Admin
$superAdmin = User::find(1); // Amjad Subhani
Auth::login($superAdmin);
echo "Logged in as Super Admin: " . Auth::user()->name . "\n";

// Run index query
$users = User::withoutGlobalScope(TenantScope::class)->latest('id')->get();
echo "Total users found: " . $users->count() . "\n";
foreach ($users as $u) {
    if (config('permission.teams')) {
        setPermissionsTeamId($u->pharmacy_id);
    }
    $roleName = $u->getRoleNames()->first();
    echo "User ID: {$u->id}, Name: '{$u->name}', Pharmacy ID: " . ($u->pharmacy_id ?? 'NULL') . ", Role: " . ($roleName ?? 'NONE') . "\n";
}
