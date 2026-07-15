<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Role::whereNull('pharmacy_id');
        if ($authUser->pharmacy_id !== null) {
            $query->where('name', '!=', 'Super Admin');
        }
        $roles = $query->with('permissions')->get();

        $formatted = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->name . ' permissions scope',
                'is_system' => in_array($role->name, ['Super Admin', 'Manager', 'Pharmacy Operator']),
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'pharmacy_id' => $role->pharmacy_id,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();

        // Only Super Admin can manage global roles
        if ($authUser->pharmacy_id !== null) {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can create roles.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Check duplicates globally
        $exists = Role::where('name', $data['name'])
            ->whereNull('pharmacy_id')
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A role with this name already exists.'], 422);
        }

        $role = Role::query()->create([
            'name' => $data['name'],
            'guard_name' => 'web',
            'pharmacy_id' => null,
        ]);

        // Assign permissions if provided
        if (!empty($data['permissions'])) {
            if (config('permission.teams')) {
                setPermissionsTeamId(null);
            }
            // Ensure permissions exist in database
            foreach ($data['permissions'] as $permName) {
                Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
            }
            $role->syncPermissions($data['permissions']);
        }

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->name . ' permissions scope',
            'is_system' => false,
            'permissions' => $role->permissions->pluck('name')->toArray(),
            'pharmacy_id' => $role->pharmacy_id,
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        $role = Role::findOrFail($id);

        // Only Super Admin can manage global roles
        if ($authUser->pharmacy_id !== null) {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can edit roles.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Check duplicate name globally
        $exists = Role::where('name', $data['name'])
            ->whereNull('pharmacy_id')
            ->where('id', '!=', $role->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A role with this name already exists.'], 422);
        }

        $role->name = $data['name'];
        $role->save();

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->name . ' permissions scope',
            'is_system' => in_array($role->name, ['Super Admin', 'Manager', 'Pharmacy Operator']),
            'permissions' => $role->permissions->pluck('name')->toArray(),
            'pharmacy_id' => $role->pharmacy_id,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        $role = Role::findOrFail($id);

        // Only Super Admin can manage global roles
        if ($authUser->pharmacy_id !== null) {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can delete roles.'], 403);
        }

        // Prevent deletion of system roles
        if (in_array($role->name, ['Super Admin', 'Manager', 'Pharmacy Operator'])) {
            return response()->json(['message' => 'System default roles cannot be deleted.'], 400);
        }

        $role->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Sync permissions to a role.
     */
    public function updatePermissions(Request $request, $roleId)
    {
        $authUser = $request->user();
        $role = Role::findOrFail($roleId);

        // Only Super Admin can update global roles
        if ($authUser->pharmacy_id !== null) {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can update role permissions.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $permissions = $request->permissions;

        if (config('permission.teams')) {
            setPermissionsTeamId(null);
        }

        // Ensure permissions exist in DB first
        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        $role->syncPermissions($permissions);

        // Explicitly clear Spatie permission cache so all users get the updated permissions immediately
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->name . ' permissions scope',
            'is_system' => in_array($role->name, ['Super Admin', 'Manager', 'Pharmacy Operator']),
            'permissions' => $role->permissions->pluck('name')->toArray(),
            'pharmacy_id' => $role->pharmacy_id,
        ]);
    }
}
