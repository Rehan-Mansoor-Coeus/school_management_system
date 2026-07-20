<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Institution;
use App\InstitutionSetting;
use App\Role;
use App\Services\InstitutionModuleService;
use App\Services\InstitutionStatsService;
use App\Support\PlatformAccess;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class SchoolController extends Controller
{
    protected $stats;

    public function __construct(InstitutionStatsService $stats)
    {
        $this->stats = $stats;

        // Platform super-admins only. This whole controller manages every
        // school on the platform, so it must never be reachable by a
        // single-school admin.
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage schools.');
            }

            return $next($request);
        });
    }

    /**
     * Platform-wide KPI cards.
     */
    public function overview()
    {
        return response()->json($this->stats->platformOverview());
    }

    /**
     * Every school with licensing + headline stats.
     */
    public function index(Request $request)
    {
        $query = Institution::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('subscription_status', $request->status);
        }

        $schools = $query->orderBy('name')->get()->map(function (Institution $institution) {
            $payload = $this->stats->forInstitution($institution);

            return array_merge($payload['institution'], [
                'license' => $payload['license'],
                'stats' => $payload['stats'],
            ]);
        });

        return response()->json(['data' => $schools]);
    }

    /**
     * Single school detail: stats, licensing, and its admin accounts.
     */
    public function show(Institution $institution)
    {
        $payload = $this->stats->forInstitution($institution);
        $payload['admins'] = $this->adminAccounts($institution);
        $payload['modules'] = $this->moduleList($institution);

        return response()->json($payload);
    }

    /**
     * Create a brand new school and enable the default module set.
     */
    public function storeSchool(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:institutions,code',
            'type' => 'required|in:university,college,school,vocational,technical,training',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'subscription_plan' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institution = Institution::create(array_merge($validator->validated(), [
            'is_active' => true,
            'subscription_status' => 'active',
            'subscription_started_at' => now(),
        ]));

        InstitutionSetting::updateOrCreate(['institution_id' => $institution->id], []);
        app(InstitutionModuleService::class)->syncDefaultsForInstitution($institution->id);

        return response()->json([
            'message' => 'School created successfully.',
            'school' => $this->stats->forInstitution($institution->fresh()),
        ], 201);
    }

    /**
     * Adjust plan, status, expiry, seat limit and activation for a school.
     */
    public function updateLicense(Request $request, Institution $institution)
    {
        $validator = Validator::make($request->all(), [
            'subscription_plan' => 'nullable|string|max:100',
            'subscription_status' => 'nullable|in:active,trial,suspended,expired',
            'subscription_started_at' => 'nullable|date',
            'subscription_expires_at' => 'nullable|date',
            'max_users' => 'nullable|integer|min:0',
            'license_key' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Empty strings from form inputs should clear the date, not fail casting.
        foreach (['subscription_started_at', 'subscription_expires_at', 'max_users', 'license_key'] as $nullable) {
            if (array_key_exists($nullable, $data) && $data[$nullable] === '') {
                $data[$nullable] = null;
            }
        }

        $institution->update($data);

        return response()->json([
            'message' => 'License updated successfully.',
            'school' => $this->stats->forInstitution($institution->fresh()),
        ]);
    }

    /**
     * Create an administrator login account bound to a specific school.
     */
    public function storeAdmin(Request $request, Institution $institution)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'username' => 'nullable|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:admin,institution-admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $roleName = $request->input('role', 'institution-admin');
        $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();

        if (! $role) {
            return response()->json(['message' => "Role '{$roleName}' is not available."], 422);
        }

        $user = User::create([
            'institution_id' => $institution->id,
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
            'message' => 'School administrator created successfully.',
            'admin' => $this->presentAdmin($user->fresh('roles')),
        ], 201);
    }

    /**
     * Create a student login account bound to a specific school.
     */
    public function storeStudent(Request $request, Institution $institution)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::where('name', 'student')->where('guard_name', 'api')->first();
        if (! $role) {
            return response()->json(['message' => "Role 'student' is not available."], 422);
        }

        $payload = [
            'institution_id' => $institution->id,
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'api_token' => Str::random(60),
            'status' => 'active',
            'locale' => 'en',
        ];
        if ($request->filled('phone') && Schema::hasColumn('users', 'phone')) {
            $payload['phone'] = $request->phone;
        }

        $user = User::create($payload);
        $user->assignRole($role);
        $user = $user->fresh('roles');

        return response()->json([
            'message' => 'Student created successfully.',
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'status' => $user->status,
                'institution_id' => $user->institution_id,
                'roles' => $user->roles->pluck('name')->values(),
            ],
        ], 201);
    }

    private function adminAccounts(Institution $institution)
    {
        return User::where('institution_id', $institution->id)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', array_merge(PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES, ['admin', 'institution-admin']));
            })
            ->with('roles')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return $this->presentAdmin($user);
            });
    }

    private function presentAdmin(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'status' => $user->status,
            'roles' => $user->roles->pluck('name')->values(),
            'created_at' => $user->created_at,
        ];
    }

    private function moduleList(Institution $institution)
    {
        return $institution->modules()->orderBy('sort_order')->get()->map(function ($module) {
            return [
                'key' => $module->key,
                'name' => $module->name,
                'enabled' => (bool) optional($module->pivot)->enabled,
            ];
        });
    }
}
