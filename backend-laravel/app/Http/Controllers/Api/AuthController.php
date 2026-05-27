<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'api_token' => Str::random(60),
        ]);

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
            'token' => $user->api_token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();
        $user->api_token = Str::random(60);
        $user->save();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $user->api_token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->api_token = null;
            $user->save();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles.permissions');

        $permissions = $user->getAllPermissions()->pluck('name')->values();

        $modules = [];
        if ($user->institution_id) {
            $modules = \Illuminate\Support\Facades\DB::table('institution_modules')
                ->join('modules', 'modules.id', '=', 'institution_modules.module_id')
                ->where('institution_modules.institution_id', $user->institution_id)
                ->where('institution_modules.enabled', true)
                ->pluck('modules.key')
                ->values();
        }

        return response()->json([
            'user' => $user,
            'permissions' => $permissions,
            'enabled_modules' => $modules,
        ]);
    }
}
