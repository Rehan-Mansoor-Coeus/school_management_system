<?php

namespace App\Modules\Hr\Services;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Institution;
use App\Modules\Hr\Models\HrStaffProfile;
use App\Services\Messaging\NotificationMessageFormatter;

class HrNotificationService
{
    protected $provider;

    protected $formatter;

    public function __construct(WhatsAppMessagingProvider $provider)
    {
        $this->provider = $provider;
        $this->formatter = new NotificationMessageFormatter();
    }

    public function sendToStaff(HrStaffProfile $staff, $message, ?string $header = null)
    {
        if (! $this->provider->isConfigured()) {
            return ['success' => false, 'error' => 'WhatsApp provider not configured'];
        }

        $phone = $this->provider->normalizePhoneNumber((string) $staff->phone);
        if (! $phone) {
            return ['success' => false, 'error' => 'Invalid phone number'];
        }

        $formatted = $this->formatter->wrap(
            (string) $message,
            $header ?: 'HR UPDATE',
            optional(Institution::find($staff->institution_id))->name
        );

        return $this->provider->sendTemplateMessage($phone, ['message' => $formatted]);
    }
}
