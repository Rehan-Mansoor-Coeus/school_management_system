<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Role;
use App\User;
use App\Support\PhoneNumberGuard;
use App\Services\UserAccountNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles', 'institution:id,name,code'])
            ->loginAccounts()
            ->orderBy('name');

        $scopeId = $this->scopedInstitutionId($request);
        if ($scopeId) {
            $query->where('institution_id', $scopeId);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $isPlatformSuperAdmin = $this->isPlatformSuperAdmin($request->user());

        $validator = Validator::make($request->all(), [
            'institution_id' => ($isPlatformSuperAdmin ? 'required' : 'nullable').'|integer|exists:institutions,id',
            'name' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone_number' => 'nullable|string|max:50',
            'additional_phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $phoneErrors = PhoneNumberGuard::validationErrors($request->only([
            'phone_number', 'additional_phone_number',
        ]));
        if ($phoneErrors !== []) {
            return response()->json(['errors' => $phoneErrors], 422);
        }

        $institutionId = $this->resolveTargetInstitutionId($request);

        $user = User::create([
            'institution_id' => $institutionId,
            'name' => trim((string) $request->name) !== '' ? trim((string) $request->name) : ($request->username ?: 'User'),
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'additional_phone_number' => $request->additional_phone_number,
            'address' => $request->address,
            'status' => $request->get('status', 'active'),
            'category' => 'user',
            'api_token' => Str::random(60),
        ]);

        if ($request->filled('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $user->syncRoles($roles);
        }

        $user->load(['roles', 'institution:id,name,code']);
        if ($user->hasRole('student')) {
            (new UserAccountNotificationService())->notifyAccountCreated($user, $request->password, [
                'category' => 'academic',
            ]);
        }

        return response()->json(['message' => 'User created successfully.', 'user' => $user], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeUserAccess($request, $user);

        $isPlatformSuperAdmin = $this->isPlatformSuperAdmin($request->user());

        $validator = Validator::make($request->all(), [
            'institution_id' => ($isPlatformSuperAdmin ? 'required' : 'nullable').'|integer|exists:institutions,id',
            'name' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username,'.$user->id,
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8',
            'phone_number' => 'nullable|string|max:50',
            'additional_phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $phoneErrors = PhoneNumberGuard::validationErrors($request->only([
            'phone_number', 'additional_phone_number',
        ]), $user->id);
        if ($phoneErrors !== []) {
            return response()->json(['errors' => $phoneErrors], 422);
        }

        $user->update([
            'institution_id' => $isPlatformSuperAdmin
                ? (int) $request->institution_id
                : ($request->institution_id ?: $user->institution_id),
            'name' => trim((string) $request->name) !== '' ? trim((string) $request->name) : ($request->username ?: 'User'),
            'username' => $request->username,
            'email' => $request->email,
            'password' => $request->filled('password') ? Hash::make($request->password) : $user->password,
            'phone_number' => $request->get('phone_number', $user->phone_number),
            'additional_phone_number' => $request->get('additional_phone_number', $user->additional_phone_number),
            'address' => $request->get('address', $user->address),
            'status' => $request->get('status', $user->status ?: 'active'),
        ]);

        if ($request->filled('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $user->syncRoles($roles);
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->load(['roles', 'institution:id,name,code']),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeUserAccess($request, $user);

        \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            $user->roles()->detach();
            $user->permissions()->detach();

            if (\Illuminate\Support\Facades\Schema::hasTable('students')) {
                \App\Student::withTrashed()->where('user_id', $user->id)->forceDelete();
            }

            $user->forceDelete();
        });

        return response()->json(['message' => 'User deleted permanently.']);
    }

    public function assignRoles(Request $request, User $user)
    {
        $this->authorizeUserAccess($request, $user);

        $validator = Validator::make($request->all(), [
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->syncRoles(Role::whereIn('id', $request->roles)->get());

        return response()->json(['message' => 'User roles updated successfully.', 'roles' => $user->roles]);
    }

    protected function isPlatformSuperAdmin($user): bool
    {
        return $user && $user->hasRole(['super-admin', 'system-super-admin']);
    }

    protected function scopedInstitutionId(Request $request): ?int
    {
        if ($this->isPlatformSuperAdmin($request->user())) {
            return $request->filled('institution_id') ? (int) $request->institution_id : null;
        }

        return (int) (optional($request->user())->institution_id ?: 1);
    }

    protected function resolveTargetInstitutionId(Request $request): int
    {
        if ($this->isPlatformSuperAdmin($request->user())) {
            return (int) $request->institution_id;
        }

        return (int) (optional($request->user())->institution_id ?: 1);
    }

    protected function authorizeUserAccess(Request $request, User $user): void
    {
        if ($this->isPlatformSuperAdmin($request->user())) {
            return;
        }

        $institutionId = (int) (optional($request->user())->institution_id ?: 1);
        if ((int) $user->institution_id !== $institutionId) {
            abort(404, 'User not found.');
        }
    }
}
