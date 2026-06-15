<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayrollRun extends Model
{
    protected $table = 'hr_payroll_runs';

    protected $fillable = [
        'institution_id','run_type','title','job_id','period_start','period_end','currency','status','total_gross','total_net','notes','created_by','reviewed_by','approved_by','forwarded_to_finance_at'
    ];
    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_gross' => 'decimal:2',
        'total_net' => 'decimal:2',
        'forwarded_to_finance_at' => 'datetime'
    ];

    public function items()
    {
        return $this->hasMany(HrPayrollItem::class, 'payroll_run_id');
    }

}
