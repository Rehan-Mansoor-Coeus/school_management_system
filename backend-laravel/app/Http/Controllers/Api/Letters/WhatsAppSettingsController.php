<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\WhatsappSetting;
use Illuminate\Http\Request;

class WhatsAppSettingsController extends Controller
{
    use ResolvesLettersContext;

    public function show(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_settings', 'view_letters_menu'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $settings = WhatsappSetting::firstOrCreate(
            ['institution_id' => $this->institutionId($request)],
            [
                'enabled' => true,
                'provider' => 'wasenderapi',
                'otp_enabled' => false,
                'otp_expiry_seconds' => 180,
                'otp_resend_cooldown_seconds' => 60,
            ]
        );

        return response()->json([
            'settings' => $settings,
            'env_configured' => (bool) config('services.wasender.api_key'),
            'base_url' => config('services.wasender.base_url'),
            'session_id' => config('services.wasender.session_id') ? 'configured' : null,
        ]);
    }

    public function update(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_settings'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'enabled' => 'nullable|boolean',
            'otp_enabled' => 'nullable|boolean',
            'otp_expiry_seconds' => 'nullable|integer|min:60|max:600',
            'otp_resend_cooldown_seconds' => 'nullable|integer|min:30|max:300',
            'session_id' => 'nullable|string|max:255',
        ]);

        $settings = WhatsappSetting::firstOrCreate(['institution_id' => $this->institutionId($request)]);
        $settings->fill($data);
        $settings->save();

        return response()->json(['message' => 'WhatsApp settings updated.', 'settings' => $settings]);
    }
}
