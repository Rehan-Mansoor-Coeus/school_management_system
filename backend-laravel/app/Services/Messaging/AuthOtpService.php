<?php

namespace App\Services\Messaging;

use App\Institution;
use App\OtpLog;
use App\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * OTP flows for public auth (student signup, password reset) without an existing session.
 */
class AuthOtpService
{
    protected $whatsapp;
    protected $messageLogs;

    public function __construct(WhatsAppService $whatsapp, MessageLogService $messageLogs)
    {
        $this->whatsapp = $whatsapp;
        $this->messageLogs = $messageLogs;
    }

    public function requestSignupOtp(int $institutionId, string $phone): array
    {
        if (! Institution::where('id', $institutionId)->exists()) {
            return ['success' => false, 'message' => 'Invalid institution.'];
        }

        $normalized = $this->whatsapp->normalizePhoneNumber($phone);
        if (! $normalized) {
            return ['success' => false, 'message' => 'Enter a valid phone number.'];
        }

        if (User::where('phone_number', $normalized)->orWhere('phone_number', $phone)->exists()) {
            return ['success' => false, 'message' => 'This phone number is already registered.'];
        }

        return $this->sendPhoneOtp($institutionId, $normalized, 'auth', 'student_signup', 'Student signup verification');
    }

    public function verifySignupOtp(int $institutionId, string $phone, string $otp): array
    {
        $normalized = $this->whatsapp->normalizePhoneNumber($phone) ?: trim($phone);
        $result = $this->verifyPhoneOtp($institutionId, $normalized, 'auth', 'student_signup', $otp);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $token = Str::random(40);
        Cache::put("signup_verified:{$token}", [
            'phone' => $normalized,
            'institution_id' => $institutionId,
        ], now()->addMinutes(15));

        return [
            'success' => true,
            'message' => 'Phone verified. Complete your registration.',
            'signup_token' => $token,
        ];
    }

    public function consumeSignupToken(string $token): ?array
    {
        $key = "signup_verified:{$token}";
        $payload = Cache::get($key);
        if (! $payload) {
            return null;
        }
        Cache::forget($key);

        return $payload;
    }

    public function requestForgotUsername(string $phone): array
    {
        $user = $this->findUserByPhone($phone);
        if (! $user) {
            return ['success' => true, 'message' => 'If an account exists, your username was sent to WhatsApp.'];
        }

        $targetPhone = $this->resolveUserPhone($user);
        if (! $targetPhone) {
            return ['success' => false, 'message' => 'This account has no phone number on file.'];
        }

        $username = trim((string) ($user->username ?: $user->email ?: ''));
        if ($username === '') {
            return ['success' => false, 'message' => 'This account has no username on file. Contact your administrator.'];
        }

        $institutionName = optional($user->institution)->name;
        $formatter = new NotificationMessageFormatter();
        $message = $formatter->format(
            'USERNAME RECOVERY',
            $formatter->greeting($user->name),
            [
                $formatter->field('Username', $username),
                'If you did not request this, ignore this message.',
            ],
            $institutionName
        );

        $send = $this->whatsapp->sendTextMessage($targetPhone, $message);

        $this->messageLogs->logWhatsAppResult((int) $user->institution_id, $send, [
            'phone_number' => $targetPhone,
            'message_type' => 'text',
            'module' => 'auth',
            'message' => 'Username recovery',
        ]);

        if (! ($send['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $send['error'] ?? 'Failed to send username via WhatsApp.',
            ];
        }

        return ['success' => true, 'message' => 'If an account exists, your username was sent to WhatsApp.'];
    }

    public function requestPasswordResetOtp(string $login): array
    {
        $user = $this->findUserByLogin($login) ?: $this->findUserByPhone($login);
        if (! $user) {
            return ['success' => true, 'message' => 'If an account exists, an OTP was sent to the registered WhatsApp number.'];
        }

        $phone = $this->resolveUserPhone($user);
        if (! $phone) {
            return ['success' => false, 'message' => 'This account has no phone number for OTP delivery.'];
        }

        $result = $this->sendPhoneOtp(
            (int) $user->institution_id,
            $phone,
            'auth',
            'password_reset',
            'Password reset verification'
        );

        if ($result['success'] ?? false) {
            Cache::put("password_reset_user:{$phone}", $user->id, now()->addMinutes(15));
        }

        return $result;
    }

    public function verifyPasswordResetOtp(string $login, string $otp): array
    {
        $user = $this->findUserByLogin($login) ?: $this->findUserByPhone($login);
        if (! $user) {
            return ['success' => false, 'message' => 'Invalid OTP.'];
        }

        $phone = $this->resolveUserPhone($user);
        if (! $phone) {
            return ['success' => false, 'message' => 'Unable to verify OTP for this account.'];
        }

        $result = $this->verifyPhoneOtp((int) $user->institution_id, $phone, 'auth', 'password_reset', $otp);
        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $token = Str::random(40);
        Cache::put("password_reset_verified:{$token}", $user->id, now()->addMinutes(15));

        return [
            'success' => true,
            'message' => 'OTP verified. Set your new password.',
            'reset_token' => $token,
        ];
    }

    public function consumePasswordResetToken(string $token): ?int
    {
        $key = "password_reset_verified:{$token}";
        $userId = Cache::get($key);
        if (! $userId) {
            return null;
        }
        Cache::forget($key);

        return (int) $userId;
    }

    protected function sendPhoneOtp(int $institutionId, string $phone, string $module, string $action, string $context): array
    {
        $settings = $this->messageLogs->settingsForInstitution($institutionId);
        $cooldown = (int) $settings->otp_resend_cooldown_seconds;

        $recent = OtpLog::query()
            ->where('institution_id', $institutionId)
            ->where('phone_number', $phone)
            ->where('module', $module)
            ->where('action', $action)
            ->where('status', 'pending')
            ->where('sent_at', '>=', now()->subSeconds($cooldown))
            ->latest('id')
            ->first();

        if ($recent) {
            return [
                'success' => true,
                'resent' => false,
                'message' => 'OTP already sent. Please wait before requesting another.',
                'expires_at' => optional($recent->expires_at)->toIso8601String(),
            ];
        }

        $otp = (string) random_int(100000, 999999);
        $expirySeconds = (int) $settings->otp_expiry_seconds;

        $send = $this->whatsapp->sendOtp($phone, $otp, $context);

        $this->messageLogs->logWhatsAppResult($institutionId, $send, [
            'phone_number' => $phone,
            'message_type' => 'otp',
            'module' => $module,
            'message' => 'OTP for '.$action,
        ]);

        if (! ($send['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $send['error'] ?? 'Failed to send OTP via WhatsApp.',
            ];
        }

        OtpLog::query()
            ->where('institution_id', $institutionId)
            ->where('phone_number', $phone)
            ->where('module', $module)
            ->where('action', $action)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        $log = OtpLog::create([
            'institution_id' => $institutionId,
            'user_id' => 0,
            'module' => $module,
            'related_id' => null,
            'action' => $action,
            'otp' => $otp,
            'phone_number' => $phone,
            'sent_at' => now(),
            'expires_at' => now()->addSeconds($expirySeconds),
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'resent' => true,
            'message' => 'OTP sent to your WhatsApp number.',
            'expires_at' => optional($log->expires_at)->toIso8601String(),
        ];
    }

    protected function verifyPhoneOtp(int $institutionId, string $phone, string $module, string $action, string $otp): array
    {
        $log = OtpLog::query()
            ->where('institution_id', $institutionId)
            ->where('phone_number', $phone)
            ->where('module', $module)
            ->where('action', $action)
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if (! $log) {
            return ['success' => false, 'message' => 'No active OTP found. Request a new code.'];
        }

        if ($log->expires_at && $log->expires_at->isPast()) {
            $log->status = 'expired';
            $log->save();

            return ['success' => false, 'message' => 'OTP has expired. Request a new code.'];
        }

        if (trim($otp) !== trim($log->otp)) {
            return ['success' => false, 'message' => 'Invalid OTP.'];
        }

        $log->status = 'verified';
        $log->verified_at = now();
        $log->save();

        return ['success' => true, 'message' => 'OTP verified.'];
    }

    public function findUserByPhone(string $phone): ?User
    {
        return $this->resolveUserForPhoneLookup($phone);
    }

    public function findUserByLogin(string $login): ?User
    {
        $login = trim($login);
        if ($login === '') {
            return null;
        }

        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $login)->first();
        }

        $user = User::where('username', $login)->first();
        if ($user) {
            return $user;
        }

        return $this->resolveUserForPhoneLookup($login);
    }

    /**
     * When the same phone exists on a staff/admin account and a student record,
     * prefer the login account so staff are not signed in as students.
     */
    protected function resolveUserForPhoneLookup(string $phone): ?User
    {
        $phone = trim($phone);
        if ($phone === '') {
            return null;
        }

        $query = $this->phoneMatchQuery(User::query(), $phone);
        $loginAccount = (clone $query)->loginAccounts()->orderBy('id')->first();
        if ($loginAccount) {
            return $loginAccount;
        }

        return $query->orderBy('id')->first();
    }

    protected function phoneMatchQuery($query, string $phone)
    {
        $normalized = $this->whatsapp->normalizePhoneNumber($phone);
        if ($normalized) {
            return $query->where(function ($q) use ($phone, $normalized) {
                $q->where('phone_number', $normalized)
                    ->orWhere('phone_number', $phone)
                    ->orWhere('additional_phone_number', $normalized)
                    ->orWhere('additional_phone_number', $phone);
            });
        }

        return $query->where(function ($q) use ($phone) {
            $q->where('phone_number', $phone)->orWhere('additional_phone_number', $phone);
        });
    }

    protected function resolveUserPhone(User $user): ?string
    {
        $phone = trim((string) ($user->phone_number ?: $user->additional_phone_number ?: ''));
        if ($phone === '') {
            return null;
        }

        return $this->whatsapp->normalizePhoneNumber($phone) ?: $phone;
    }
}
