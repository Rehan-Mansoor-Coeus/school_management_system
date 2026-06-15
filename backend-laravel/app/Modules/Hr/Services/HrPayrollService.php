<?php

namespace App\Modules\Hr\Services;

use App\Modules\Hr\Models\HrAdvancePayment;
use App\Modules\Hr\Models\HrFinancePayment;
use App\Modules\Hr\Models\HrInstitutionSetting;
use App\Modules\Hr\Models\HrJob;
use App\Modules\Hr\Models\HrJobStaff;
use App\Modules\Hr\Models\HrPayrollApproval;
use App\Modules\Hr\Models\HrPayrollItem;
use App\Modules\Hr\Models\HrPayrollRun;
use App\Modules\Hr\Models\HrPayslip;
use App\Modules\Hr\Models\HrStaffProfile;
use App\Modules\Hr\Models\HrTimesheetEntry;
use Illuminate\Support\Facades\DB;

class HrPayrollService
{
    protected $calculator;

    public function __construct(HrPayrollCalculator $calculator)
    {
        $this->calculator = $calculator;
    }

    public function createFromJob($institutionId, $jobId, $userId)
    {
        $job = HrJob::where('institution_id', $institutionId)->findOrFail($jobId);

        return DB::transaction(function () use ($institutionId, $job, $userId) {
            $currency = $this->currencyForInstitution($institutionId);
            $run = HrPayrollRun::create([
                'institution_id' => $institutionId,
                'run_type' => 'job',
                'title' => 'Job Payroll: ' . $job->name,
                'job_id' => $job->id,
                'period_start' => $job->start_date,
                'period_end' => $job->end_date,
                'currency' => $currency,
                'status' => 'draft',
                'created_by' => $userId,
            ]);

            $totalGross = 0;
            $totalNet = 0;

            $assignments = HrJobStaff::where('job_id', $job->id)->get();
            foreach ($assignments as $assignment) {
                $days = $this->calculator->effectiveDays($assignment);
                $basic = $this->calculator->num($assignment->daily_rate) * $days;
                $advances = HrAdvancePayment::where('institution_id', $institutionId)
                    ->where('staff_profile_id', $assignment->staff_profile_id)
                    ->where('status', 'open')
                    ->sum('balance_remaining');

                $totals = $this->calculator->calcItemTotals([
                    'basic' => $basic,
                    'allowances' => [],
                    'deductions' => [],
                    'advances' => $advances,
                ]);

                HrPayrollItem::create([
                    'payroll_run_id' => $run->id,
                    'staff_profile_id' => $assignment->staff_profile_id,
                    'basic_amount' => $totals['basic'],
                    'daily_rate' => $assignment->daily_rate,
                    'days_worked' => $days,
                    'gross_amount' => $totals['gross'],
                    'total_allowances' => $totals['totalAllowances'],
                    'total_deductions' => $totals['totalDeductions'],
                    'total_advances' => $advances,
                    'net_amount' => $totals['net'],
                    'payment_status' => 'pending',
                ]);

                $totalGross += $totals['gross'];
                $totalNet += $totals['net'];
            }

            $run->update(['total_gross' => $totalGross, 'total_net' => $totalNet]);
            $this->recordApproval($run->id, 'draft', $userId, 'Created from job');

            return $run;
        });
    }

    public function createMonthly($institutionId, $periodStart, $periodEnd, $title, $userId)
    {
        return DB::transaction(function () use ($institutionId, $periodStart, $periodEnd, $title, $userId) {
            $currency = $this->currencyForInstitution($institutionId);
            $run = HrPayrollRun::create([
                'institution_id' => $institutionId,
                'run_type' => 'monthly',
                'title' => $title ?: ('Monthly Payroll ' . $periodStart . ' to ' . $periodEnd),
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'currency' => $currency,
                'status' => 'draft',
                'created_by' => $userId,
            ]);

            $staff = HrStaffProfile::where('institution_id', $institutionId)
                ->where('status', 'active')
                ->where('payment_type', 'monthly')
                ->get();

            $expectedHours = $this->expectedHoursForPeriod($periodStart, $periodEnd);
            $totalGross = 0;
            $totalNet = 0;

            foreach ($staff as $row) {
                $actualHours = HrTimesheetEntry::where('institution_id', $institutionId)
                    ->where('staff_profile_id', $row->id)
                    ->whereBetween('entry_date', [$periodStart, $periodEnd])
                    ->whereIn('status', ['submitted', 'confirmed'])
                    ->sum('hours_worked');

                $basic = $this->calculator->num($row->monthly_salary);
                $advances = HrAdvancePayment::where('institution_id', $institutionId)
                    ->where('staff_profile_id', $row->id)
                    ->where('status', 'open')
                    ->sum('balance_remaining');

                $totals = $this->calculator->calcItemTotals([
                    'basic' => $basic,
                    'allowances' => [],
                    'deductions' => [],
                    'advances' => $advances,
                ]);

                HrPayrollItem::create([
                    'payroll_run_id' => $run->id,
                    'staff_profile_id' => $row->id,
                    'basic_amount' => $totals['basic'],
                    'hours_expected' => $expectedHours,
                    'hours_actual' => $actualHours,
                    'overtime_hours' => max(0, $actualHours - $expectedHours),
                    'gross_amount' => $totals['gross'],
                    'total_allowances' => $totals['totalAllowances'],
                    'total_deductions' => $totals['totalDeductions'],
                    'total_advances' => $advances,
                    'net_amount' => $totals['net'],
                    'payment_status' => 'pending',
                ]);

                $totalGross += $totals['gross'];
                $totalNet += $totals['net'];
            }

            $run->update(['total_gross' => $totalGross, 'total_net' => $totalNet]);
            $this->recordApproval($run->id, 'draft', $userId, 'Created monthly payroll');

            return $run;
        });
    }

    public function submit($institutionId, $runId, $userId, $notes = null)
    {
        return $this->transition($institutionId, $runId, 'review', $userId, $notes, ['reviewed_by' => $userId]);
    }

    public function approve($institutionId, $runId, $userId, $notes = null)
    {
        return $this->transition($institutionId, $runId, 'approved', $userId, $notes, ['approved_by' => $userId]);
    }

    public function forward($institutionId, $runId, $userId, $notes = null)
    {
        $run = $this->transition($institutionId, $runId, 'finance', $userId, $notes, ['forwarded_to_finance_at' => now()]);

        $items = HrPayrollItem::where('payroll_run_id', $run->id)->get();
        foreach ($items as $item) {
            HrFinancePayment::firstOrCreate(
                ['institution_id' => $institutionId, 'payroll_item_id' => $item->id],
                [
                    'payroll_run_id' => $run->id,
                    'amount' => $item->net_amount,
                    'status' => 'pending',
                ]
            );

            $this->generatePayslip($institutionId, $item->id);
        }

        return $run;
    }

    public function reject($institutionId, $runId, $userId, $notes = null)
    {
        return $this->transition($institutionId, $runId, 'rejected', $userId, $notes);
    }

    public function generatePayslip($institutionId, $payrollItemId)
    {
        $item = HrPayrollItem::whereHas('payrollRun', function ($query) use ($institutionId) {
            $query->where('institution_id', $institutionId);
        })->findOrFail($payrollItemId);

        return HrPayslip::firstOrCreate(
            ['payroll_item_id' => $item->id],
            [
                'verification_code' => strtoupper(substr(md5($institutionId . '-' . $item->id . '-' . microtime(true)), 0, 12)),
                'generated_at' => now(),
            ]
        );
    }

    protected function transition($institutionId, $runId, $status, $userId, $notes = null, array $extra = [])
    {
        $run = HrPayrollRun::where('institution_id', $institutionId)->findOrFail($runId);
        $run->status = $status;
        foreach ($extra as $key => $value) {
            $run->{$key} = $value;
        }
        $run->save();

        $this->recordApproval($run->id, $status, $userId, $notes);

        return $run;
    }

    protected function recordApproval($runId, $stage, $userId, $notes)
    {
        return HrPayrollApproval::create([
            'payroll_run_id' => $runId,
            'stage' => $stage,
            'action_by' => $userId,
            'notes' => $notes,
        ]);
    }

    protected function currencyForInstitution($institutionId)
    {
        $settings = HrInstitutionSetting::where('institution_id', $institutionId)->first();

        return $settings && $settings->default_currency ? $settings->default_currency : 'UGX';
    }

    protected function expectedHoursForPeriod($start, $end)
    {
        $s = strtotime($start);
        $e = strtotime($end);
        if (! $s || ! $e || $e < $s) {
            return 0;
        }

        $days = floor(($e - $s) / 86400) + 1;

        return round(($days / 7) * 40, 2);
    }
}
