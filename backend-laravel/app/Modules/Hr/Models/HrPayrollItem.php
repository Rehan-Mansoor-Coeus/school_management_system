<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayrollItem extends Model
{
    protected $table = 'hr_payroll_items';

    protected $fillable = [
        'payroll_run_id','staff_profile_id','basic_amount','daily_rate','days_worked','hours_expected','hours_actual','overtime_hours','gross_amount','total_allowances','total_deductions','total_advances','net_amount','payment_status','notes'
    ];
    protected $casts = [
        'basic_amount' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'days_worked' => 'decimal:2',
        'hours_expected' => 'decimal:2',
        'hours_actual' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'total_allowances' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_advances' => 'decimal:2',
        'net_amount' => 'decimal:2'
    ];

    public function payrollRun()
    {
        return $this->belongsTo(HrPayrollRun::class, 'payroll_run_id');
    }

}
