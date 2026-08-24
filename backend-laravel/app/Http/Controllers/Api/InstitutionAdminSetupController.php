<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\InstitutionRegistrationRequest;
use App\Role;
use App\User;
use App\Services\UserAccountNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InstitutionAdminSetupController extends Controller
{
    public function show(string $token)
    {
        $record = $this->findValidRequest($token);
        if (! $record) {
            return response()->json(['message' => 'This setup link is invalid or has expired.'], 404);
        }

        return response()->json([
            'institution_name' => $record->institution_name,
            'contact_person' => $record->contact_person,
            'email' => $record->email,
            'phone' => $record->phone,
            'institution_id' => $record->institution_id,
            'expires_at' => optional($record->admin_setup_token_expires_at)->toIso8601String(),
        ]);
    }

    public function store(Request $request, string $token)
    {
        $record = $this->findValidRequest($token);
        if (! $record) {
            return response()->json(['message' => 'This setup link is invalid or has expired.'], 404);
        }

        if (! $record->institution_id) {
            return response()->json(['message' => 'Institution is not ready for admin setup yet.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::where('name', 'institution-admin')->where('guard_name', 'api')->first()
            ?: Role::where('name', 'admin')->where('guard_name', 'api')->first();

        if (! $role) {
            return response()->json(['message' => 'Administrator role is not available.'], 422);
        }

        $plainPassword = $request->password;
        $user = User::create([
            'institution_id' => $record->institution_id,
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'phone_number' => $record->phone,
            'password' => Hash::make($plainPassword),
            'api_token' => Str::random(60),
            'status' => 'active',
            'locale' => 'en',
        ]);
        $user->assignRole($role);

        $record->admin_setup_token_hash = null;
        $record->admin_setup_token_expires_at = null;
        $record->admin_setup_completed_at = now();
        $record->save();

        try {
            (new UserAccountNotificationService())->notifyAccountCreated($user, $plainPassword, [
                'link' => '/admin',
            ]);
        } catch (\Throwable $e) {
            // Account is created even if follow-up messaging fails.
        }

        return response()->json([
            'message' => 'Administrator account created. You can sign in now.',
            'login_url' => rtrim((string) env('FRONTEND_URL', env('APP_URL', 'https://okusoma.com')), '/').'/admin',
        ], 201);
    }

    protected function findValidRequest(string $token): ?InstitutionRegistrationRequest
    {
        $token = trim($token);
        if ($token === '' || strlen($token) < 20) {
            return null;
        }

        $hash = hash('sha256', $token);
        $record = InstitutionRegistrationRequest::query()
            ->where('admin_setup_token_hash', $hash)
            ->where('status', 'approved')
            ->whereNull('admin_setup_completed_at')
            ->first();

        if (! $record) {
            return null;
        }

        if ($record->admin_setup_token_expires_at && $record->admin_setup_token_expires_at->isPast()) {
            return null;
        }

        return $record;
    }
}
