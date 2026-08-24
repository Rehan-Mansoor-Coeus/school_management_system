<?php

namespace App\Services;

use App\InstitutionRegistrationRequest;
use App\Services\Messaging\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InstitutionRegistrationWhatsAppNotifier
{
    protected $whatsapp;

    public function __construct(?WhatsAppService $whatsapp = null)
    {
        $this->whatsapp = $whatsapp ?: new WhatsAppService();
    }

    public function frontendBase(): string
    {
        return rtrim((string) env('FRONTEND_URL', env('APP_URL', 'https://okusoma.com')), '/');
    }

    public function platformNotifyPhone(): ?string
    {
        $raw = config('services.platform_notify_whatsapp', env('PLATFORM_NOTIFY_WHATSAPP', '+250794006160'));

        return $this->whatsapp->normalizePhoneNumber((string) $raw) ?: null;
    }

    public function notifyPlatformOfNewRequest(InstitutionRegistrationRequest $record): void
    {
        if (! $this->whatsapp->isConfigured()) {
            Log::warning('Institution request WhatsApp skipped: Wasender not configured.');

            return;
        }

        $to = $this->platformNotifyPhone();
        if (! $to) {
            Log::warning('Institution request WhatsApp skipped: PLATFORM_NOTIFY_WHATSAPP missing.');

            return;
        }

        $approveUrl = $this->frontendBase().'/admin?redirect='.rawurlencode('/institution-requests?tab=awaiting&request_id='.$record->id);
        $text = implode("\n", [
            'ASSMS — New institution request',
            'Institution: '.$record->institution_name,
            'Contact: '.$record->contact_person,
            'Phone: '.$record->phone,
            'Email: '.$record->email,
            'City: '.($record->city ?: '—').', '.($record->country ?: '—'),
            '',
            'Review & approve:',
            $approveUrl,
        ]);

        $result = $this->whatsapp->sendTextMessage($to, $text, 'institution_request_admin');
        if (! ($result['success'] ?? false)) {
            Log::warning('Institution request WhatsApp to platform failed', [
                'request_id' => $record->id,
                'error' => $result['error'] ?? null,
            ]);
        }
    }

    /**
     * Issue a one-time admin setup token and WhatsApp the applicant.
     *
     * @return string|null Plain token (for tests); null if WhatsApp skipped after token saved.
     */
    public function issueAdminSetupInvite(InstitutionRegistrationRequest $record): ?string
    {
        $plain = Str::random(48);
        $record->admin_setup_token_hash = hash('sha256', $plain);
        $record->admin_setup_token_expires_at = now()->addDays(7);
        $record->admin_setup_completed_at = null;
        $record->save();

        if (! $this->whatsapp->isConfigured()) {
            Log::warning('Institution approval WhatsApp skipped: Wasender not configured.', [
                'request_id' => $record->id,
            ]);

            return $plain;
        }

        $to = $this->whatsapp->normalizePhoneNumber((string) $record->phone);
        if (! $to) {
            Log::warning('Institution approval WhatsApp skipped: invalid applicant phone.', [
                'request_id' => $record->id,
            ]);

            return $plain;
        }

        $setupUrl = $this->frontendBase().'/setup-institution-admin/'.$plain;
        $text = implode("\n", [
            'ASSMS — Institution approved',
            'Hello '.$record->contact_person.',',
            'Your institution "'.$record->institution_name.'" has been approved.',
            '',
            'Set up your Admin login here (link expires in 7 days):',
            $setupUrl,
            '',
            'After setup, sign in at '.$this->frontendBase().'/admin',
        ]);

        $result = $this->whatsapp->sendTextMessage($to, $text, 'institution_request_approved');
        if (! ($result['success'] ?? false)) {
            Log::warning('Institution approval WhatsApp to applicant failed', [
                'request_id' => $record->id,
                'error' => $result['error'] ?? null,
            ]);
        }

        return $plain;
    }
}
