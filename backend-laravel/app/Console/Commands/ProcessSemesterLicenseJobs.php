<?php

namespace App\Console\Commands;

use App\Modules\Licensing\Models\BillingSetting;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Services\LicenseAuditService;
use App\Modules\Licensing\Services\LicenseNotificationService;
use App\Modules\Licensing\Services\SemesterLicenseService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProcessSemesterLicenseJobs extends Command
{
    protected $signature = 'licensing:process-semester-jobs';

    protected $description = 'Lock due semester licenses, mark overdue/suspended balances, and send reminders.';

    public function handle(
        SemesterLicenseService $service,
        LicenseNotificationService $notifications,
        LicenseAuditService $audit
    ) {
        if (! Schema::hasTable('institution_semester_licenses')) {
            $this->info('Semester license tables not present.');

            return 0;
        }

        $locked = 0;
        $overdue = 0;
        $suspended = 0;
        $reminders = 0;
        $settings = BillingSetting::current();
        $grace = (int) ($settings->default_grace_period_days ?? 7);
        $autoSuspend = (bool) ($settings->auto_suspend_on_overdue ?? true);

        // Lock approaching (3 days)
        $approaching = InstitutionSemesterLicense::query()
            ->whereNull('locked_at')
            ->whereNotNull('student_count_lock_date')
            ->whereDate('student_count_lock_date', '<=', now()->addDays(3)->toDateString())
            ->whereDate('student_count_lock_date', '>', now()->toDateString())
            ->whereIn('status', ['active', 'down_payment_paid'])
            ->get();
        foreach ($approaching as $license) {
            $notifications->notifySemesterEvent($license, 'lock_approaching');
            $reminders++;
        }

        $dueLocks = InstitutionSemesterLicense::query()
            ->whereNull('locked_at')
            ->whereNotNull('student_count_lock_date')
            ->whereDate('student_count_lock_date', '<=', now()->toDateString())
            ->whereIn('status', ['active', 'down_payment_paid', 'awaiting_reconciliation'])
            ->get();

        foreach ($dueLocks as $license) {
            try {
                $updated = $service->lockCount($license, null, 'Automatic lock by scheduler', null);
                $locked++;
                $notifications->notifySemesterEvent($updated, 'locked');
                $audit->log([
                    'institution_id' => $updated->institution_id,
                    'institution_semester_license_id' => $updated->id,
                    'entity_type' => 'institution_semester_license',
                    'entity_id' => $updated->id,
                    'action' => 'lock',
                    'reason' => 'Automatic lock by scheduler',
                ]);
            } catch (\Throwable $e) {
                Log::warning('licensing.lock_failed', [
                    'id' => $license->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $balanceDue = InstitutionSemesterLicense::query()
            ->whereIn('status', ['balance_due', 'partially_paid', 'awaiting_reconciliation', 'overdue', 'grace_period'])
            ->where('balance_due', '>', 0)
            ->get();

        foreach ($balanceDue as $license) {
            $since = $license->reconciled_at ?: $license->locked_at;
            if (! $since) {
                continue;
            }
            $days = $since->diffInDays(now());
            $old = $license->status;

            if ($days > $grace && $autoSuspend && $license->status !== 'suspended') {
                $license->update(['status' => 'suspended']);
                $suspended++;
                $notifications->notifySemesterEvent($license->fresh(), 'suspended');
                $audit->log([
                    'institution_id' => $license->institution_id,
                    'institution_semester_license_id' => $license->id,
                    'entity_type' => 'institution_semester_license',
                    'entity_id' => $license->id,
                    'action' => 'status_change',
                    'field' => 'status',
                    'old_value' => $old,
                    'new_value' => 'suspended',
                    'reason' => 'Auto-suspend after grace',
                ]);
            } elseif ($days > $grace && $license->status !== 'overdue' && $license->status !== 'suspended') {
                $license->update(['status' => 'overdue']);
                $overdue++;
                $notifications->notifySemesterEvent($license->fresh(), 'overdue');
            } elseif ($days > 0 && $days <= $grace && $license->status !== 'grace_period' && $license->status !== 'suspended') {
                $license->update(['status' => 'grace_period']);
                $notifications->notifySemesterEvent($license->fresh(), 'grace');
                $reminders++;
            } elseif ($days >= max(0, $grace - 3)) {
                $notifications->notifySemesterEvent($license, 'final_balance');
                $reminders++;
            }
        }

        $downAwaiting = InstitutionSemesterLicense::query()
            ->whereIn('status', ['awaiting_down_payment', 'down_payment_partially_paid'])
            ->get();
        foreach ($downAwaiting as $license) {
            $notifications->notifySemesterEvent($license, 'down_payment_due');
            $reminders++;
        }

        $this->info("Locked: {$locked}, overdue: {$overdue}, suspended: {$suspended}, reminders: {$reminders}");

        return 0;
    }
}
