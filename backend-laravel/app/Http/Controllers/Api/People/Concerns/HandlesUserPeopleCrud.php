<?php

namespace App\Http\Controllers\Api\People\Concerns;

use App\Role;
use App\User;
use App\Support\ProtectedSystemAccounts;
use App\Services\UserAccountNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * CRUD for "people" that live in the single `users` table and are classified
 * purely by their Spatie role (student / teacher / staff). There is no separate
 * table or model per category: a teacher is simply a user with the "teacher" role.
 */
trait HandlesUserPeopleCrud
{
    /** The role name that defines this category, e.g. 'student'. */
    abstract protected function categoryRole(): string;

    abstract protected function viewPermissions(): array;

    abstract protected function createPermissions(): array;

    abstract protected function editPermissions(): array;

    abstract protected function deletePermissions(): array;

    protected function baseQuery($institutionId)
    {
        $role = $this->categoryRole();

        return User::query()
            ->where('institution_id', $institutionId)
            ->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            })
            ->with('roles:id,name');
    }

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, $this->viewPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = $this->baseQuery($this->institutionId($request));

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('additional_phone_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $result = $query->orderBy('name')->paginate((int) $request->get('per_page', 20));
        $result->getCollection()->each(function (User $user) {
            $user->append('role_ids');
        });

        return response()->json($result);
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, $this->createPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $phoneErrors = \App\Support\PhoneNumberGuard::validationErrors($request->only([
            'phone_number', 'additional_phone_number',
        ]));
        if ($phoneErrors !== []) {
            return response()->json(['errors' => $phoneErrors, 'message' => 'Validation failed.'], 422);
        }

        $data = $validator->validated();
        $status = $request->get('status', 'active');
        $plainPassword = null;

        $user = new User();
        $user->institution_id = $this->institutionId($request);
        $user->name = $this->resolvePersonName($data['name'] ?? null, $request);
        $user->email = $data['email'] ?? null;
        $user->phone_number = $this->normalizePhone($data['phone_number'] ?? null);
        $user->additional_phone_number = $data['additional_phone_number'] ?? null;
        $user->address = $data['address'] ?? null;
        $user->status = $status;
        $user->is_active = $status === 'active';
        $user->locale = 'en';

        if ($this->categoryRole() === 'student' && ($user->email || $request->filled('username'))) {
            $plainPassword = $request->filled('password')
                ? $request->password
                : UserAccountNotificationService::generateTemporaryPassword();
            $user->username = $request->username
                ?: UserAccountNotificationService::generateUsername($user->name, $user->email ?: $user->phone_number);
            $user->password = Hash::make($plainPassword);
            $user->api_token = Str::random(60);
        } else {
            // People without login email get an unusable password.
            $user->password = Hash::make(Str::random(40));
        }

        $user->save();

        $this->syncCategoryRoles($user, $request);

        if ($this->categoryRole() === 'student' && $user->institution_id) {
            try {
                app(\App\Modules\Licensing\Services\SemesterLicenseService::class)
                    ->syncOpenSemestersForInstitution((int) $user->institution_id);
            } catch (\Throwable $e) {
                // non-blocking
            }
        }

        if ($plainPassword) {
            (new UserAccountNotificationService())->notifyAccountCreated($user, $plainPassword, [
                'category' => 'academic',
            ]);
        }

        return response()->json([
            'message' => 'Record created.',
            'data' => $this->present($user),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->baseQuery($this->institutionId($request))->find($id);
        if (! $user) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, $this->editPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), $this->rules(true));
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $phoneErrors = \App\Support\PhoneNumberGuard::validationErrors($request->only([
            'phone_number', 'additional_phone_number',
        ]), $user->id);
        if ($phoneErrors !== []) {
            return response()->json(['errors' => $phoneErrors, 'message' => 'Validation failed.'], 422);
        }

        $data = $validator->validated();
        $status = $request->get('status', $user->status ?: 'active');

        $user->name = $this->resolvePersonName($data['name'] ?? null, $request, $user);
        $user->email = $data['email'] ?? null;
        $user->phone_number = $this->normalizePhone($data['phone_number'] ?? null);
        $user->additional_phone_number = $data['additional_phone_number'] ?? null;
        $user->address = $data['address'] ?? null;
        $user->status = $status;
        $user->is_active = $status === 'active';

        if ($request->filled('username')) {
            $user->username = $request->username;
        }
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
            if (! $user->api_token) {
                $user->api_token = Str::random(60);
            }
        }

        $user->save();

        $this->syncCategoryRoles($user, $request);

        return response()->json([
            'message' => 'Record updated.',
            'data' => $this->present($user),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->baseQuery($this->institutionId($request))->find($id);
        if (! $user) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, $this->deletePermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $this->hardDeleteUser($user);

        return response()->json(['message' => 'Record deleted.']);
    }

    public function bulkDestroy(Request $request)
    {
        if (! $this->hasAnyPermission($request, $this->deletePermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return response()->json(['message' => 'No records selected.'], 422);
        }

        $users = $this->baseQuery($this->institutionId($request))->whereIn('id', $ids)->get();

        $deleted = 0;
        $skipped = 0;
        foreach ($users as $user) {
            if (ProtectedSystemAccounts::isProtected($user)) {
                $skipped++;
                continue;
            }
            $this->hardDeleteUser($user);
            $deleted++;
        }

        $message = "{$deleted} record(s) deleted.";
        if ($skipped > 0) {
            $message .= " {$skipped} protected system account(s) skipped.";
        }

        return response()->json(['message' => $message, 'deleted' => $deleted, 'skipped' => $skipped]);
    }

    /**
     * Permanently remove a user and the records that belong to it so nothing is
     * left behind in the database (no soft-deleted ghost rows).
     */
    protected function hardDeleteUser(User $user): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            // Drop role / permission pivots.
            $user->roles()->detach();
            $user->permissions()->detach();

            // Remove the student profile (and its dependent rows) if present.
            if (\Illuminate\Support\Facades\Schema::hasTable('students')) {
                \App\Student::where('user_id', $user->id)->get()->each(function ($student) {
                    if (method_exists($student, 'forceDelete')) {
                        $student->forceDelete();
                    } else {
                        $student->delete();
                    }
                });
            }

            // Bypass soft deletes so the row is physically removed.
            if (method_exists($user, 'forceDelete')) {
                $user->forceDelete();
            } else {
                $user->delete();
            }
        });
    }

    protected function rules($updating = false): array
    {
        $emailRule = 'nullable|email|max:255';
        if ($this->categoryRole() === 'student' && ! $updating) {
            $emailRule = 'nullable|email|max:255|unique:users,email';
        }

        $usernameRule = 'nullable|string|max:255|unique:users,username';
        if ($updating) {
            $usernameRule = 'nullable|string|max:255';
        }

        return [
            'name' => 'nullable|string|max:255',
            'username' => $usernameRule,
            'email' => $emailRule,
            'password' => 'nullable|string|min:8',
            'phone_number' => 'nullable|string|max:50',
            'additional_phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'roles' => 'nullable|array',
            'roles.*' => 'integer|exists:roles,id',
        ];
    }

    /** Use a display name when the field is left blank (DB column is non-null). */
    protected function resolvePersonName(?string $name, Request $request, ?User $user = null): string
    {
        $normalized = trim((string) $name);
        if ($normalized !== '') {
            return $normalized;
        }

        if ($request->filled('username')) {
            return trim((string) $request->username);
        }

        if ($user && $user->username) {
            return $user->username;
        }

        foreach (['email', 'phone_number'] as $field) {
            $fromUser = $user ? $user->{$field} : null;
            $value = trim((string) ($request->get($field) ?: $fromUser));
            if ($value !== '') {
                return $value;
            }
        }

        return 'User';
    }

    protected function normalizePhone(?string $phone): ?string
    {
        $phone = trim((string) $phone);

        return $phone === '' ? null : $phone;
    }

    /**
     * Assign the selected roles plus the mandatory category role (so the record
     * is always discoverable as a student / teacher / staff member).
     */
    protected function syncCategoryRoles(User $user, Request $request): void
    {
        $ids = collect($request->get('roles', []))
            ->filter()
            ->map(function ($id) {
                return (int) $id;
            })
            ->values();

        $roles = Role::whereIn('id', $ids)->where('guard_name', 'api')->get();

        $categoryRole = Role::where('name', $this->categoryRole())->where('guard_name', 'api')->first();
        if ($categoryRole) {
            $roles->push($categoryRole);
        }

        $user->syncRoles($roles->unique('id')->values());
    }

    protected function present(User $user): User
    {
        return $user->fresh(['roles:id,name'])->append('role_ids');
    }
}
