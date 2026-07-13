<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\SaaS\Services\TenantService;
use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PharmacyController extends Controller
{
    public function __construct(private TenantService $tenantService)
    {
    }

    public function index(Request $request)
    {
        $pharmacies = Pharmacy::with(['plan', 'users' => fn ($query) => $query->with('roles')->latest('id')])
            ->latest('id')
            ->get()
            ->map(fn ($pharmacy) => $this->formatPharmacy($pharmacy));

        return response()->json($pharmacies);
    }

    public function store(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'pharmacy_name' => 'required|string|max:150',
            'pharmacy_slug' => 'nullable|string|max:150|unique:pharmacies,slug',
            'pharmacy_address' => 'nullable|string|max:255',
            'pharmacy_phone' => 'nullable|string|max:30',
            'owner_name' => 'nullable|string|max:255',
            'owner_email' => 'nullable|string|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:8',
            'owner_phone' => 'nullable|string|max:30',
            'status' => ['nullable', Rule::in(['trial', 'active', 'suspended'])],
            'trial_days' => 'nullable|integer|min:0|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $result = $this->tenantService->registerTenant([
            ...$data,
            'name' => $data['owner_name'] ?? null,
            'email' => $data['owner_email'] ?? null,
            'phone' => $data['owner_phone'] ?? null,
            'status' => $data['status'] ?? 'trial',
            'trial_days' => $data['trial_days'] ?? 30,
        ]);

        $pharmacy = $result['pharmacy']->fresh(['plan', 'users.roles']);

        return response()->json([
            'message' => 'Pharmacy created successfully.',
            'pharmacy' => $this->formatPharmacy($pharmacy),
            'credentials' => !empty($data['owner_email']) ? [
                'email' => $data['owner_email'],
                'password' => $data['password'] ?? null,
            ] : null,
        ], 201);
    }

    public function update(Request $request, Pharmacy $pharmacy)
    {
        $ownerId = $pharmacy->users()->latest('id')->value('id');

        $validator = Validator::make($request->all(), [
            'pharmacy_name' => 'sometimes|string|max:150',
            'pharmacy_slug' => ['sometimes', 'string', 'max:150', Rule::unique('pharmacies', 'slug')->ignore($pharmacy->id)],
            'pharmacy_address' => 'sometimes|string|max:255',
            'pharmacy_phone' => 'sometimes|string|max:30',
            'owner_name' => 'sometimes|string|max:255',
            'owner_email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($ownerId)],
            'owner_phone' => 'sometimes|string|max:30',
            'password' => 'sometimes|string|min:8',
            'status' => ['sometimes', Rule::in(['trial', 'active', 'suspended'])],
            'trial_days' => 'sometimes|integer|min:0|max:365',
            'role' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['pharmacy_name'])) {
            $pharmacy->name = $data['pharmacy_name'];
        }
        if (isset($data['pharmacy_slug'])) {
            $pharmacy->slug = $data['pharmacy_slug'];
        }
        if (isset($data['status'])) {
            $pharmacy->status = $data['status'];
            if ($data['status'] !== 'trial') {
                $pharmacy->trial_ends_at = null;
            }
        }
        if (isset($data['trial_days']) && $pharmacy->status === 'trial') {
            $pharmacy->trial_ends_at = now()->addDays((int) $data['trial_days']);
        }

        $owner = $pharmacy->users()->latest('id')->first();

        if ($owner) {
            if (array_key_exists('owner_name', $data)) {
                $owner->name = $data['owner_name'];
            }
            if (array_key_exists('owner_email', $data)) {
                $owner->email = $data['owner_email'];
            }
            if (array_key_exists('owner_phone', $data)) {
                $owner->phone = $data['owner_phone'];
            }
            if (array_key_exists('password', $data) && !empty($data['password'])) {
                $owner->password = Hash::make($data['password']);
            }
            if (array_key_exists('role', $data) && !empty($data['role'])) {
                if (config('permission.teams')) {
                    setPermissionsTeamId((int) $pharmacy->id);
                }
                
                $roleName = $data['role'];
                // Map old/deprecated role names to Manager
                if (in_array(strtolower($roleName), ['admin', 'owner'])) {
                    $roleName = 'Manager';
                }

                // Ensure the role exists for this pharmacy context before syncing
                \Spatie\Permission\Models\Role::query()->firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'pharmacy_id' => $pharmacy->id,
                ]);

                $owner->syncRoles([$roleName]);
            }
            $owner->save();
        } else if (!empty($data['owner_email'])) {
            $branch = $pharmacy->branches()->where('is_main', true)->first()
                ?? $pharmacy->branches()->first()
                ?? \App\Models\Branch::create([
                    'pharmacy_id' => $pharmacy->id,
                    'name' => 'Main Branch',
                    'is_main' => true,
                ]);

            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacy->id);
            }

            \Spatie\Permission\Models\Role::query()->firstOrCreate([
                'name' => 'Manager',
                'guard_name' => 'web',
                'pharmacy_id' => $pharmacy->id,
            ]);

            $owner = \App\Models\User::create([
                'pharmacy_id' => $pharmacy->id,
                'branch_id' => $branch->id,
                'name' => $data['owner_name'] ?? 'Owner',
                'email' => $data['owner_email'],
                'password' => Hash::make($data['password'] ?? 'Password123!'),
                'phone' => $data['owner_phone'] ?? null,
                'status' => 'active',
            ]);

            $owner->assignRole('Manager');
        }

        $pharmacy->save();

        $mainBranch = $pharmacy->branches()->where('is_main', true)->first() 
            ?? $pharmacy->branches()->first();
        if ($mainBranch) {
            if (array_key_exists('pharmacy_address', $data)) {
                $mainBranch->address = $data['pharmacy_address'];
            }
            if (array_key_exists('pharmacy_phone', $data)) {
                $mainBranch->phone = $data['pharmacy_phone'];
            }
            $mainBranch->save();
        }

        $pharmacy->load(['plan', 'users.roles']);

        return response()->json([
            'message' => 'Pharmacy updated successfully.',
            'pharmacy' => $this->formatPharmacy($pharmacy),
        ]);
    }

    public function destroy(Pharmacy $pharmacy)
    {
        $pharmacy->delete();

        return response()->json([
            'message' => 'Pharmacy deleted successfully.',
        ]);
    }


    private function formatPharmacy(Pharmacy $pharmacy): array
    {
        $owner = $pharmacy->users->first();
        $mainBranch = $pharmacy->branches()->where('is_main', true)->first() 
            ?? $pharmacy->branches()->first();

        $roleName = null;
        if ($owner) {
            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacy->id);
            }
            $roleName = $owner->roles->first()?->name;
        }

        return [
            'id' => $pharmacy->id,
            'name' => $pharmacy->name,
            'slug' => $pharmacy->slug,
            'status' => $pharmacy->status,
            'trial_ends_at' => optional($pharmacy->trial_ends_at)->toDateString(),
            'plan' => $pharmacy->plan?->name,
            'owner_name' => $owner?->name,
            'owner_email' => $owner?->email,
            'owner_phone' => $owner?->phone,
            'role' => $roleName ?? 'Manager',
            'pharmacy_address' => $mainBranch?->address,
            'pharmacy_phone' => $mainBranch?->phone,
            'created_at' => optional($pharmacy->created_at)->toDateString(),
        ];
    }
}
