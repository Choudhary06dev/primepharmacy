<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::find(3); // ahmad@gmail.com
echo "User: {$user->name}, Email: {$user->email}, Pharmacy ID: {$user->pharmacy_id}\n";

if (config('permission.teams')) {
    setPermissionsTeamId((int) $user->pharmacy_id);
}

$roles = $user->roles()->get();
echo "Roles associated directly to model:\n";
foreach ($roles as $role) {
    echo "  - Role ID: {$role->id}, Name: {$role->name}, Pharmacy ID: {$role->pharmacy_id}\n";
}

$allRoles = $user->getRoleNames();
echo "getRoleNames(): " . json_encode($allRoles) . "\n";

$permissions = $user->getAllPermissions();
echo "getAllPermissions() count: " . count($permissions) . "\n";
foreach ($permissions as $p) {
    echo "  - Permission: {$p->name}\n";
}
