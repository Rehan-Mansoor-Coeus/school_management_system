<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractNotification;
use App\Modules\Contracts\Models\DocumentWorkflowSetting;
use Illuminate\Support\Carbon;

class DocumentExpiryProcessor
{
    protected $notifications;

    public function __construct(ContractNotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    /**
     * Scan documents nearing expiry and dispatch reminders based on the lead times
     * configured per institution (license settings). Safe to run daily.
     *
     * @return array Summary of alerts sent, keyed by institution id.
     */
    public function processDue(): array
    {
        $summary = [];

        $institutionIds = Contract::query()
            ->whereNotNull('end_date')
            ->distinct()
            ->pluck('institution_id');

        foreach ($institutionIds as $institutionId) {
            $settings = DocumentWorkflowSetting::forInstitution($institutionId);

            if (! $settings->expiry_alerts_enabled) {
                continue;
            }

            $days = $settings->alertDays();
            $channels = $settings->alertChannels();
            $extraRecipients = $settings->extraRecipients();
            $maxDays = max($days);
            $today = Carbon::today();

            $contracts = Contract::query()
                ->where('institution_id', $institutionId)
                ->whereNotNull('end_date')
                ->whereNotIn('status', ['rejected', 'expired'])
                ->whereDate('end_date', '>=', $today->toDateString())
                ->whereDate('end_date', '<=', $today->copy()->addDays($maxDays)->toDateString())
                ->get();

            // Smallest (most urgent) threshold first.
            $ascending = array_reverse($days);

            foreach ($contracts as $contract) {
                $remaining = $today->diffInDays(Carbon::parse($contract->end_date), false);
                if ($remaining < 0) {
                    continue;
                }

                // Thresholds the document has crossed and not yet been alerted for.
                $unsentCrossed = array_values(array_filter(
                    $ascending,
                    fn ($t) => $remaining <= $t && ! $this->alreadyAlerted($contract->id, $t)
                ));

                if (empty($unsentCrossed)) {
                    continue;
                }

                // Send a single alert for the most urgent (smallest) unsent crossed threshold.
                $threshold = $unsentCrossed[0];
                $this->notifications->sendExpiryAlert($contract, $remaining, $channels, $extraRecipients, $threshold);
                $summary[$institutionId][] = [
                    'contract_id' => $contract->id,
                    'reference' => $contract->reference_number,
                    'threshold' => $threshold,
                    'days_left' => $remaining,
                ];

                // Suppress any larger thresholds already crossed so they don't double-alert later.
                foreach (array_slice($unsentCrossed, 1) as $covered) {
                    $this->markSuppressed($contract, $covered);
                }
            }
        }

        return $summary;
    }

    protected function alreadyAlerted(int $contractId, int $threshold): bool
    {
        return ContractNotification::query()
            ->where('contract_id', $contractId)
            ->where('channel', 'expiry_alert')
            ->where('message', 'like', '%[expiry-'.$threshold.']%')
            ->exists();
    }

    protected function markSuppressed(Contract $contract, int $threshold): void
    {
        ContractNotification::create([
            'institution_id' => $contract->institution_id,
            'contract_id' => $contract->id,
            'channel' => 'expiry_alert',
            'recipient' => 'system',
            'status' => 'suppressed',
            'message' => "[expiry-{$threshold}] Superseded by a more urgent expiry alert.",
            'sent_at' => now(),
        ]);
    }
}
