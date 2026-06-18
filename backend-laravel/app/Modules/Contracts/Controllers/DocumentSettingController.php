<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Concerns\ResolvesInstitution;
use App\Modules\Contracts\Models\DocumentWorkflowSetting;
use Illuminate\Http\Request;

class DocumentSettingController extends Controller
{
    use ResolvesInstitution;

    public function show()
    {
        $settings = DocumentWorkflowSetting::forInstitution($this->institutionId());

        return response()->json(['success' => true, 'data' => $this->present($settings)]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'expiry_alerts_enabled' => 'nullable|boolean',
            'expiry_alert_days' => 'nullable|array',
            'expiry_alert_days.*' => 'integer|min:1|max:3650',
            'expiry_alert_channels' => 'nullable|array',
            'expiry_alert_channels.*' => 'in:email,whatsapp,internal',
            'expiry_alert_recipients' => 'nullable|string|max:2000',
        ]);

        $settings = DocumentWorkflowSetting::forInstitution($this->institutionId());

        if (array_key_exists('expiry_alert_days', $data) && is_array($data['expiry_alert_days'])) {
            $days = array_values(array_unique(array_filter(array_map('intval', $data['expiry_alert_days']), fn ($d) => $d > 0)));
            rsort($days);
            $data['expiry_alert_days'] = $days ?: DocumentWorkflowSetting::DEFAULT_ALERT_DAYS;
        }

        if (array_key_exists('expiry_alert_channels', $data) && empty($data['expiry_alert_channels'])) {
            $data['expiry_alert_channels'] = DocumentWorkflowSetting::DEFAULT_ALERT_CHANNELS;
        }

        $settings->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Document workflow settings updated.',
            'data' => $this->present($settings->fresh()),
        ]);
    }

    protected function present(DocumentWorkflowSetting $settings): array
    {
        return [
            'institution_id' => $settings->institution_id,
            'expiry_alerts_enabled' => (bool) $settings->expiry_alerts_enabled,
            'expiry_alert_days' => $settings->alertDays(),
            'expiry_alert_channels' => $settings->alertChannels(),
            'expiry_alert_recipients' => $settings->expiry_alert_recipients,
        ];
    }
}
