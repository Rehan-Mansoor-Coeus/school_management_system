<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermissionController extends Controller
{
    public function index()
    {
        return response()->json(Permission::with('roles')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100|unique:permissions',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $permission = Permission::create(['name' => $request->name, 'guard_name' => 'api']);

        return response()->json(['message' => 'Permission created successfully.', 'permission' => $permission], 201);
    }

    public function update(Request $request, Permission $permission)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100|unique:permissions,name,' . $permission->id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $permission->update(['name' => $request->name]);

        return response()->json(['message' => 'Permission updated successfully.', 'permission' => $permission]);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return response()->json(['message' => 'Permission deleted successfully.']);
    }
}
