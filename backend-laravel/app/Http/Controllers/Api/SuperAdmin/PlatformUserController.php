<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Role;
use App\Support\PlatformAccess;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class PlatformUserController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage platform users.');
            }

            return $next($request);
        });
    }

    /**
     * List platform super admins and institution administrators.
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'all'); // all|super_admin|institution_admin

        $query = User::query()->with(['roles:id,name', 'institution:id,name,code']);

        if ($type === 'super_admin') {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('name', PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES);
            });
        } elseif ($type === 'institution_admin') {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('name', ['admin', 'institution-admin', 'super-admin']);
            })->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES);
            });
        } else {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('name', array_merge(
                    PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES,
                    ['admin', 'institution-admin', 'super-admin']
                ));
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('username', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('institution_id')) {
            $query->where('institution_id', (int) $request->institution_id);
        }

        $users = $query->orderBy('name')->get()->map(function (User $user) {
            return $this->present($user);
        });

        return response()->json(['data' => $users]);
    }

    /**
     * Create a platform super admin or an institution-linked admin.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'account_type' => 'required|in:super_admin,institution_admin',
            'institution_id' => 'required_if:account_type,institution_admin|nullable|integer|exists:institutions,id',
            'role' => 'nullable|in:admin,institution-admin,super-admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $accountType = $request->input('account_type');

        if ($accountType === 'super_admin') {
            $roleName = 'system-super-admin';
            $institutionId = null;
        } else {
            $roleName = $request->input('role', 'institution-admin');
            $institutionId = (int) $request->input('institution_id');
            if (! $institutionId) {
                return response()->json(['message' => 'Institution is required for admin accounts.'], 422);
            }
            if (! Institution::where('id', $institutionId)->exists()) {
                return response()->json(['message' => 'Institution not found.'], 404);
            }
        }

        $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
        if (! $role) {
            return response()->json(['message' => "Role '{$roleName}' is not available."], 422);
        }

        $user = User::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'api_token' => Str::random(60),
            'status' => 'active',
            'locale' => 'en',
        ]);

        $user->assignRole($role);

        return response()->json([
            'message' => $accountType === 'super_admin'
                ? 'Platform super admin created successfully.'
                : 'Institution admin created successfully.',
            'user' => $this->present($user->fresh(['roles', 'institution'])),
        ], 201);
    }

    private function present(User $user): array
    {
        $roles = $user->roles->pluck('name')->values();
        $isPlatform = $roles->intersect(PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES)->isNotEmpty();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'status' => $user->status,
            'account_type' => $isPlatform ? 'super_admin' : 'institution_admin',
            'roles' => $roles,
            'institution_id' => $user->institution_id,
            'institution' => $user->institution ? [
                'id' => $user->institution->id,
                'name' => $user->institution->name,
                'code' => $user->institution->code,
            ] : null,
            'created_at' => $user->created_at,
        ];
    }
}
