<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\SaaS\Services\TenantService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    protected TenantService $tenantService;

    public function __construct(TenantService $tenantService)
    {
        $this->tenantService = $tenantService;
    }

    /**
     * Register a new pharmacy and owner user.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pharmacy_name' => 'required|string|max:150',
            'pharmacy_slug' => 'nullable|string|max:150|unique:pharmacies,slug',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:30',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->tenantService->registerTenant($validator->validated());

        $user = $result['user'];
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Pharmacy registered successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'pharmacy_id' => $user->pharmacy_id,
                'branch_id' => $user->branch_id,
            ],
            'pharmacy' => $result['pharmacy'],
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Authenticate user and create token.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your user account is inactive. Please contact your administrator.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load(['pharmacy', 'branch']);

        if (config('permission.teams')) {
            setPermissionsTeamId((int) $user->pharmacy_id);
        }
        $roles = $user->getRoleNames();
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'message' => 'Login successful.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'pharmacy_id' => $user->pharmacy_id,
                'branch_id' => $user->branch_id,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
            'pharmacy' => $user->pharmacy,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Terminate user session.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['pharmacy', 'branch']);

        if (config('permission.teams')) {
            setPermissionsTeamId((int) $user->pharmacy_id);
        }
        $roles = $user->getRoleNames();
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'pharmacy_id' => $user->pharmacy_id,
                'branch_id' => $user->branch_id,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
            'pharmacy' => $user->pharmacy,
            'branch' => $user->branch,
        ]);
    }
}
