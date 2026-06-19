<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Role;
use App\User;
use App\Services\Messaging\AuthOtpService;
use App\Support\ProtectedSystemAccounts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    protected $authOtp;

    public function __construct(AuthOtpService $authOtp)
    {
        $this->authOtp = $authOtp;
    }

    public function publicInstitutions()
    {
        $institutions = Institution::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country']);

        return response()->json($institutions);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'nullable|integer|min:1',
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'institution_id' => $request->institution_id ?: 1,
            'name' => $request->name,
            'username' => $request->username,
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

    public function requestSignupOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|integer|exists:institutions,id',
            'phone_number' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->authOtp->requestSignupOtp(
            (int) $request->institution_id,
            $request->phone_number
        );

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function verifySignupOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|integer|exists:institutions,id',
            'phone_number' => 'required|string|max:50',
            'otp' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->authOtp->verifySignupOtp(
            (int) $request->institution_id,
            $request->phone_number,
            $request->otp
        );

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function studentSignup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'signup_token' => 'required|string',
            'institution_id' => 'required|integer|exists:institutions,id',
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone_number' => 'required|string|max:50',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $verified = $this->authOtp->consumeSignupToken($request->signup_token);
        if (! $verified) {
            return response()->json(['message' => 'Phone verification expired. Request a new OTP.'], 422);
        }

        if ((int) $verified['institution_id'] !== (int) $request->institution_id) {
            return response()->json(['message' => 'Institution mismatch.'], 422);
        }

        $user = User::create([
            'institution_id' => (int) $request->institution_id,
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $verified['phone'],
            'address' => $request->address,
            'status' => 'active',
            'api_token' => Str::random(60),
        ]);

        $studentRole = Role::where('name', 'student')->where('guard_name', 'api')->first();
        if ($studentRole) {
            $user->assignRole($studentRole);
        }

        return response()->json([
            'message' => 'Account created successfully. You can sign in now.',
            'user' => $user->load('roles'),
            'token' => $user->api_token,
        ], 201);
    }

    public function requestForgotUsername(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->authOtp->requestForgotUsername($request->phone_number);

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function requestPasswordResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'nullable|string',
            'phone_number' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $identifier = trim((string) ($request->phone_number ?: $request->login ?: ''));
        if ($identifier === '') {
            return response()->json(['errors' => ['phone_number' => ['Phone number is required.']]], 422);
        }

        $result = $this->authOtp->requestPasswordResetOtp($identifier);

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function verifyPasswordResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'nullable|string',
            'phone_number' => 'nullable|string|max:50',
            'otp' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $identifier = trim((string) ($request->phone_number ?: $request->login ?: ''));
        if ($identifier === '') {
            return response()->json(['errors' => ['phone_number' => ['Phone number is required.']]], 422);
        }

        $result = $this->authOtp->verifyPasswordResetOtp($identifier, $request->otp);

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = $this->authOtp->consumePasswordResetToken($request->reset_token);
        if (! $userId) {
            return response()->json(['message' => 'Reset session expired. Start again.'], 422);
        }

        $user = User::find($userId);
        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password updated. You can sign in now.']);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $login = trim($request->login);
        $password = $request->password;
        $authenticated = false;

        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            $authenticated = Auth::attempt(['email' => $login, 'password' => $password]);
        } elseif ($this->looksLikePhone($login)) {
            $user = $this->authOtp->findUserByLogin($login);
            if ($user && Hash::check($password, $user->password)) {
                Auth::login($user);
                $authenticated = true;
            }
        } else {
            $authenticated = Auth::attempt(['username' => $login, 'password' => $password]);
            if (! $authenticated) {
                $user = User::where('email', $login)->first();
                if ($user && Hash::check($password, $user->password)) {
                    Auth::login($user);
                    $authenticated = true;
                }
            }
        }

        if (! $authenticated) {
            if (config('app.debug')) {
                Log::warning('Login failed', [
                    'login' => $login,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();

        if ($user->status === 'inactive') {
            Auth::logout();

            return response()->json(['message' => 'This account is inactive. Contact your administrator.'], 403);
        }

        if ($user->trashed()) {
            Auth::logout();

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Issue a fresh API token on every login so stale browser tokens cannot linger.
        $user->api_token = Str::random(60);
        $user->save();

        if (ProtectedSystemAccounts::isProtected($user)) {
            $superAdmin = Role::where('name', 'super-admin')->where('guard_name', 'api')->first();
            if ($superAdmin && ! $user->hasRole($superAdmin)) {
                $user->assignRole($superAdmin);
            }
        }

        return response()->json(array_merge([
            'message' => 'Login successful.',
            'token' => $user->api_token,
        ], $this->buildAuthPayload($user)));
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
        return response()->json($this->buildAuthPayload($request->user()));
    }

    protected function looksLikePhone(string $login): bool
    {
        $digits = preg_replace('/\D/', '', $login);

        return strlen($digits) >= 8 && (strpos($login, '+') === 0 || ctype_digit(str_replace(['+', ' ', '-', '(', ')'], '', $login)));
    }

    protected function buildAuthPayload(User $user): array
    {
        $user->load(['roles', 'institution']);

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

        return [
            'user' => $user,
            'permissions' => $permissions,
            'enabled_modules' => $modules,
            'institution' => $user->institution,
        ];
    }
}
