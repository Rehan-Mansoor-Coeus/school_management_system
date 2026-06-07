<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Role;
use App\User;
use App\Services\UserAccountNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        $institutionId = (int) (optional(request()->user())->institution_id ?: 1);
        return response()->json(User::with('roles')->loginAccounts()->where('institution_id', $institutionId)->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'nullable|integer|min:1',
            'name' => 'required|string|max:255',
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

        $user = User::create([
            'institution_id' => $request->institution_id ?: (optional($request->user())->institution_id ?: 1),
            'name' => $request->name,
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

        $user->load('roles');
        if ($user->hasRole('student')) {
            (new UserAccountNotificationService())->notifyAccountCreated($user, $request->password, [
                'category' => 'academic',
            ]);
        }

        return response()->json(['message' => 'User created successfully.', 'user' => $user->load('roles')], 201);
    }

    public function update(Request $request, User $user)
    {
        $institutionId = (int) (optional($request->user())->institution_id ?: 1);
        if ((int) $user->institution_id !== $institutionId) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'institution_id' => 'nullable|integer|min:1',
            'name' => 'required|string|max:255',
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

        $user->update([
            'institution_id' => $request->institution_id ?: $user->institution_id,
            'name' => $request->name,
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

        return response()->json(['message' => 'User updated successfully.', 'user' => $user->load('roles')]);
    }

    public function destroy(User $user)
    {
        $institutionId = (int) (optional(request()->user())->institution_id ?: 1);
        if ((int) $user->institution_id !== $institutionId) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function assignRoles(Request $request, User $user)
    {
        $institutionId = (int) (optional($request->user())->institution_id ?: 1);
        if ((int) $user->institution_id !== $institutionId) {
            return response()->json(['message' => 'User not found.'], 404);
        }

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
}
