<?php

namespace App\Console\Commands;

use App\Institution;
use App\Modules\Licensing\Models\BillingSetting;
use App\Modules\Licensing\Models\InstitutionLicense;
use App\Modules\Licensing\Services\LicenseAuditService;
use App\Modules\Licensing\Services\LicenseNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProcessInstitutionLicenseJobs extends Command
{
    protected $signature = 'licensing:process-institution-jobs';

    protected $description = 'Expire fixed licenses, enter grace period, and send renewal reminders.';

    public function handle(LicenseNotificationService $notifications, LicenseAuditService $audit)
    {
        if (! Schema::hasTable('institution_licenses')) {
            $this->info('Institution licenses table not present.');

            return 0;
        }

        $graceDays = (int) (BillingSetting::current()->default_grace_period_days ?? 7);
        $reminded = 0;
        $graced = 0;
        $expired = 0;

        $expiringSoon = InstitutionLicense::query()
            ->where('is_current', true)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays(14)->toDateString())
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->whereIn('license_status', ['active', 'trial', 'pending_payment'])
            ->get();

        foreach ($expiringSoon as $license) {
            $institution = Institution::find($license->institution_id);
            if ($institution) {
                $notifications->notifyInstitutionLicenseExpiry(
                    $institution,
                    'renewal_reminder',
                    optional($license->expiry_date)->toDateString()
                );
                $reminded++;
            }
        }

        $pastDue = InstitutionLicense::query()
            ->where('is_current', true)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now()->toDateString())
            ->whereIn('license_status', ['active', 'trial', 'overdue', 'grace_period'])
            ->get();

        foreach ($pastDue as $license) {
            $daysPast = $license->expiry_date->diffInDays(now());
            $old = $license->license_status;

            if ($daysPast <= $graceDays) {
                if ($license->license_status !== 'grace_period') {
                    $license->update([
                        'license_status' => 'grace_period',
                        'grace_period_end' => $license->expiry_date->copy()->addDays($graceDays),
                    ]);
                    $graced++;
                    $audit->log([
                        'institution_id' => $license->institution_id,
                        'institution_license_id' => $license->id,
                        'entity_type' => 'institution_license',
                        'entity_id' => $license->id,
                        'action' => 'status_change',
                        'field' => 'license_status',
                        'old_value' => $old,
                        'new_value' => 'grace_period',
                        'reason' => 'Automatic grace after expiry',
                    ]);
                    $institution = Institution::find($license->institution_id);
                    if ($institution) {
                        $notifications->notifyInstitutionLicenseExpiry(
                            $institution,
                            'grace_period',
                            optional($license->expiry_date)->toDateString()
                        );
                    }
                }
            } else {
                if ($license->license_status !== 'expired') {
                    $license->update(['license_status' => 'expired']);
                    if ($license->institution) {
                        $license->institution->update([
                            'subscription_status' => 'expired',
                        ]);
                    }
                    $expired++;
                    $audit->log([
                        'institution_id' => $license->institution_id,
                        'institution_license_id' => $license->id,
                        'entity_type' => 'institution_license',
                        'entity_id' => $license->id,
                        'action' => 'status_change',
                        'field' => 'license_status',
                        'old_value' => $old,
                        'new_value' => 'expired',
                        'reason' => 'Automatic expiry after grace',
                    ]);
                    $institution = Institution::find($license->institution_id);
                    if ($institution) {
                        $notifications->notifyInstitutionLicenseExpiry(
                            $institution,
                            'expired',
                            optional($license->expiry_date)->toDateString()
                        );
                    }
                }
            }
        }

        Log::info('licensing.institution_jobs', compact('reminded', 'graced', 'expired'));
        $this->info("Reminded: {$reminded}, grace: {$graced}, expired: {$expired}");

        return 0;
    }
}
