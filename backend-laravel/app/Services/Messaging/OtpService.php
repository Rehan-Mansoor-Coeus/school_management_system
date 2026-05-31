<?php

namespace App\Services\Messaging;

use App\OtpLog;
use App\User;
use Illuminate\Support\Facades\Log;

class OtpService
{
    protected $whatsapp;
    protected $messageLogs;

    public function __construct(WhatsAppService $whatsapp, MessageLogService $messageLogs)
    {
        $this->whatsapp = $whatsapp;
        $this->messageLogs = $messageLogs;
    }

    public function requestOtp(
        User $user,
        int $institutionId,
        string $module,
        ?int $relatedId,
        string $action,
        ?string $context = null
    ): array {
        $settings = $this->messageLogs->settingsForInstitution($institutionId);

        if (! $settings->otp_enabled) {
            return ['success' => true, 'otp_required' => false];
        }

        $phone = $this->resolveUserPhone($user);
        if (! $phone) {
            return ['success' => false, 'message' => 'Your account has no phone number for OTP delivery.'];
        }

        $cooldown = (int) $settings->otp_resend_cooldown_seconds;
        $recent = OtpLog::query()
            ->where('user_id', $user->id)
            ->where('module', $module)
            ->where('related_id', $relatedId)
            ->where('action', $action)
            ->where('status', 'pending')
            ->where('sent_at', '>=', now()->subSeconds($cooldown))
            ->latest('id')
            ->first();

        if ($recent) {
            return [
                'success' => true,
                'otp_required' => true,
                'resent' => false,
                'message' => 'OTP already sent. Please wait before requesting another.',
                'expires_at' => optional($recent->expires_at)->toIso8601String(),
            ];
        }

        $otp = (string) random_int(100000, 999999);
        $expirySeconds = (int) $settings->otp_expiry_seconds;

        $send = $this->whatsapp->sendOtp(
            $phone,
            $otp,
            $context ?: ucfirst(str_replace('_', ' ', $action)).' verification'
        );

        $this->messageLogs->logWhatsAppResult($institutionId, $send, [
            'recipient_name' => $user->name,
            'phone_number' => $phone,
            'message_type' => 'otp',
            'module' => $module,
            'related_id' => $relatedId,
            'message' => 'OTP for '.$action,
        ]);

        if (! ($send['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $send['error'] ?? 'Failed to send OTP via WhatsApp.',
            ];
        }

        OtpLog::query()
            ->where('user_id', $user->id)
            ->where('module', $module)
            ->where('related_id', $relatedId)
            ->where('action', $action)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        $log = OtpLog::create([
            'institution_id' => $institutionId,
            'user_id' => $user->id,
            'module' => $module,
            'related_id' => $relatedId,
            'action' => $action,
            'otp' => $otp,
            'phone_number' => $phone,
            'sent_at' => now(),
            'expires_at' => now()->addSeconds($expirySeconds),
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'otp_required' => true,
            'resent' => true,
            'message' => 'OTP sent to your WhatsApp number.',
            'expires_at' => optional($log->expires_at)->toIso8601String(),
        ];
    }

    public function verifyOtp(
        User $user,
        string $module,
        ?int $relatedId,
        string $action,
        string $otp
    ): array {
        $log = OtpLog::query()
            ->where('user_id', $user->id)
            ->where('module', $module)
            ->where('related_id', $relatedId)
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

    public function isVerifiedRecently(
        User $user,
        string $module,
        ?int $relatedId,
        string $action,
        int $withinSeconds = 300
    ): bool {
        return OtpLog::query()
            ->where('user_id', $user->id)
            ->where('module', $module)
            ->where('related_id', $relatedId)
            ->where('action', $action)
            ->where('status', 'verified')
            ->where('verified_at', '>=', now()->subSeconds($withinSeconds))
            ->exists();
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
