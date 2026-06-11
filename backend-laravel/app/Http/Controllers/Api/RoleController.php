<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Permission;
use App\Role;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::with('permissions')->orderBy('name');

        if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
            $query->whereNotIn('name', PlatformAccess::roles());
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:50', 'unique:roles', Rule::notIn(PlatformAccess::roles())],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::create(['name' => $request->name, 'guard_name' => 'api']);

        return response()->json(['message' => 'Role created successfully.', 'role' => $role], 201);
    }

    public function update(Request $request, Role $role)
    {
        $this->authorizePlatformRoleManagement($request, $role);

        if (PlatformAccess::isPlatformRole($role)) {
            return response()->json(['message' => 'This role cannot be renamed. Update its permissions instead.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:50', 'unique:roles,name,'.$role->id, Rule::notIn(PlatformAccess::roles())],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role->update(['name' => $request->name]);

        return response()->json(['message' => 'Role updated successfully.', 'role' => $role]);
    }

    public function destroy(Request $request, Role $role)
    {
        $this->authorizePlatformRoleManagement($request, $role);

        if (PlatformAccess::isPlatformRole($role)) {
            return response()->json(['message' => 'This role cannot be deleted.'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully.']);
    }

    public function assignPermissions(Request $request, Role $role)
    {
        $this->authorizePlatformRoleManagement($request, $role);

        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role->syncPermissions(Permission::whereIn('id', $request->permissions)->get());

        return response()->json([
            'message' => 'Role permissions updated successfully.',
            'permissions' => $role->permissions,
        ]);
    }

    protected function authorizePlatformRoleManagement(Request $request, Role $role): void
    {
        if (PlatformAccess::isPlatformRole($role) && ! PlatformAccess::isPlatformSuperAdmin($request->user())) {
            abort(403, 'You are not authorized to manage this role.');
        }
    }
}
