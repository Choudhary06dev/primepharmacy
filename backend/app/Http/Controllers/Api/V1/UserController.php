<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        // Super Admin gets all users
        if ($authUser->pharmacy_id === null) {
            $users = User::latest('id')->get();
        } else {
            // Tenant gets only their own pharmacy users
            $users = User::where('pharmacy_id', $authUser->pharmacy_id)
                ->latest('id')
                ->get();
        }

        // Format user role field as expected by the frontend
        $formatted = $users->map(function ($user) {
            if (config('permission.teams')) {
                setPermissionsTeamId($user->pharmacy_id);
            }
            $roleName = $user->getRoleNames()->first();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status === 'active' ? 'Active' : 'Inactive',
                'pharmacy_id' => $user->pharmacy_id,
                'branch_id' => $user->branch_id,
                'role' => $roleName ?? 'Viewer',
                'created_at' => $user->created_at->toDateString(),
            ];
        });

        // Reset permissions team context back to the logged-in user
        if (config('permission.teams')) {
            setPermissionsTeamId($authUser->pharmacy_id);
        }

        return response()->json($formatted);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $authUser = $request->user();

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:30',
            'status' => 'required|string|in:Active,Inactive',
            'role' => 'required|string',
        ];

        // Only Super Admin can assign a custom pharmacy_id
        if ($authUser->pharmacy_id === null) {
            $rules['pharmacy_id'] = 'nullable';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            \Log::error('Validation failed for User store: ' . json_encode($validator->errors()->toArray()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $pharmacyId = ($authUser->pharmacy_id === null) 
            ? ($data['pharmacy_id'] ?? null) 
            : $authUser->pharmacy_id;

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'status' => strtolower($data['status']) === 'active' ? 'active' : 'inactive',
            'pharmacy_id' => $pharmacyId,
            'branch_id' => $authUser->branch_id, // Default to same branch context
        ]);

        $roleName = $data['role'];
        // Map legacy roles to our new 3 roles
        if (in_array(strtolower($roleName), ['admin', 'owner', 'manager'])) {
            $roleName = 'Manager';
        } else if (in_array(strtolower($roleName), ['operator', 'cashier', 'pharmacist', 'stockist', 'viewer', 'pharmacy operator'])) {
            $roleName = 'Pharmacy Operator';
        }

        // Ensure the role exists for this pharmacy context before assigning
        if ($roleName !== 'Super Admin') {
            \Spatie\Permission\Models\Role::query()->firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
                'pharmacy_id' => $pharmacyId,
            ]);
        }

        // Assign Role using Spatie (handling teams)
        if (config('permission.teams')) {
            setPermissionsTeamId($pharmacyId);
        }
        $user->assignRole($roleName);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status === 'active' ? 'Active' : 'Inactive',
            'pharmacy_id' => $user->pharmacy_id,
            'branch_id' => $user->branch_id,
            'role' => $roleName,
            'created_at' => $user->created_at->toDateString(),
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $authUser = $request->user();

        // Enforce tenant boundary
        if ($authUser->pharmacy_id !== null && $user->pharmacy_id !== $authUser->pharmacy_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Remove password from validation inputs if empty so it doesn't fail min:8 rule
        $input = $request->all();
        if (empty($input['password'])) {
            unset($input['password']);
        }

        $rules = [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:30',
            'status' => 'required|string|in:Active,Inactive',
            'role' => 'required|string',
        ];

        if ($authUser->pharmacy_id === null) {
            $rules['pharmacy_id'] = 'nullable';
        }

        $validator = Validator::make($input, $rules);

        if ($validator->fails()) {
            \Log::error('Validation failed for User update: ' . json_encode($validator->errors()->toArray()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->phone = $data['phone'] ?? null;
        $user->status = strtolower($data['status']) === 'active' ? 'active' : 'inactive';

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        if ($authUser->pharmacy_id === null) {
            $user->pharmacy_id = $data['pharmacy_id'] ?? null;
        }

        $user->save();

        $roleName = $data['role'];
        // Map legacy roles to our new 3 roles
        if (in_array(strtolower($roleName), ['admin', 'owner', 'manager'])) {
            $roleName = 'Manager';
        } else if (in_array(strtolower($roleName), ['operator', 'cashier', 'pharmacist', 'stockist', 'viewer', 'pharmacy operator'])) {
            $roleName = 'Pharmacy Operator';
        }

        // Ensure the role exists for this pharmacy context before syncing
        if ($roleName !== 'Super Admin') {
            \Spatie\Permission\Models\Role::query()->firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
                'pharmacy_id' => $user->pharmacy_id,
            ]);
        }

        // Sync Spatie role
        if (config('permission.teams')) {
            setPermissionsTeamId($user->pharmacy_id);
        }
        $user->syncRoles([$roleName]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status === 'active' ? 'Active' : 'Inactive',
            'pharmacy_id' => $user->pharmacy_id,
            'branch_id' => $user->branch_id,
            'role' => $roleName,
            'created_at' => $user->created_at->toDateString(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, User $user)
    {
        $authUser = $request->user();

        // Prevent self deletion
        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete your own active logged-in user profile.'], 400);
        }

        // Enforce tenant boundary
        if ($authUser->pharmacy_id !== null && $user->pharmacy_id !== $authUser->pharmacy_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->delete();

        return response()->json(['success' => true]);
    }
}
