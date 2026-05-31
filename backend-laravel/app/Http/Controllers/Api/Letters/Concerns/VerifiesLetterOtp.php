<?php

namespace App\Http\Controllers\Api\Letters\Concerns;

use App\Services\Messaging\OtpService;
use Illuminate\Http\Request;

trait VerifiesLetterOtp
{
    protected function otpActions(): array
    {
        return ['approve', 'reject', 'sign', 'send', 'sign_and_send'];
    }

    protected function ensureOtpVerified(Request $request, $letter, string $action)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        /** @var OtpService $otpService */
        $otpService = app(OtpService::class);

        $settings = app(\App\Services\Messaging\MessageLogService::class)
            ->settingsForInstitution($letter->institution_id);
        if (! $settings->otp_enabled) {
            return null;
        }

        if ($otpService->isVerifiedRecently($user, 'letter', $letter->id, $action)) {
            return null;
        }

        $otp = trim((string) $request->get('otp', ''));
        if ($otp === '') {
            return response()->json([
                'message' => 'OTP required for this action.',
                'otp_required' => true,
            ], 422);
        }

        $verify = $otpService->verifyOtp($user, 'letter', $letter->id, $action, $otp);
        if (! ($verify['success'] ?? false)) {
            return response()->json([
                'message' => $verify['message'] ?? 'OTP verification failed.',
                'otp_required' => true,
            ], 422);
        }

        $letter->otp_verified = true;
        $letter->save();

        return null;
    }
}
