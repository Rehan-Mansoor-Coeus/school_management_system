<?php

namespace App\Modules\Hr\Services;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Modules\Hr\Models\HrStaffProfile;

class HrNotificationService
{
    protected $provider;

    public function __construct(WhatsAppMessagingProvider $provider)
    {
        $this->provider = $provider;
    }

    public function sendToStaff(HrStaffProfile $staff, $message)
    {
        if (! $this->provider->isConfigured()) {
            return ['success' => false, 'error' => 'WhatsApp provider not configured'];
        }

        $phone = $this->provider->normalizePhoneNumber((string) $staff->phone);
        if (! $phone) {
            return ['success' => false, 'error' => 'Invalid phone number'];
        }

        return $this->provider->sendTemplateMessage($phone, ['message' => $message]);
    }
}
