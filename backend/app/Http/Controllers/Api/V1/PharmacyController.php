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
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:30',
            'status' => ['nullable', Rule::in(['trial', 'active', 'suspended'])],
            'trial_days' => 'nullable|integer|min:0|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $result = $this->tenantService->registerTenant([
            ...$data,
            'status' => $data['status'] ?? 'trial',
            'trial_days' => $data['trial_days'] ?? 30,
        ]);

        $pharmacy = $result['pharmacy']->fresh(['plan', 'users.roles']);

        return response()->json([
            'message' => 'Pharmacy created successfully.',
            'pharmacy' => $this->formatPharmacy($pharmacy),
            'credentials' => !empty($data['email']) ? [
                'email' => $data['email'],
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
            'owner_name' => 'sometimes|string|max:255',
            'owner_email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($ownerId)],
            'owner_phone' => 'sometimes|string|max:30',
            'password' => 'sometimes|string|min:8',
            'status' => ['sometimes', Rule::in(['trial', 'active', 'suspended'])],
            'trial_days' => 'sometimes|integer|min:0|max:365',
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
            if (array_key_exists('password', $data)) {
                $owner->password = Hash::make($data['password']);
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

            \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => 'Owner',
                'guard_name' => 'web',
                'pharmacy_id' => $pharmacy->id,
            ]);

            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacy->id);
            }

            $owner = \App\Models\User::create([
                'pharmacy_id' => $pharmacy->id,
                'branch_id' => $branch->id,
                'name' => $data['owner_name'] ?? 'Owner',
                'email' => $data['owner_email'],
                'password' => Hash::make($data['password'] ?? 'Password123!'),
                'phone' => $data['owner_phone'] ?? null,
                'status' => 'active',
            ]);

            $owner->assignRole('Owner');
        }

        $pharmacy->save();
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
            'created_at' => optional($pharmacy->created_at)->toDateString(),
        ];
    }
}
