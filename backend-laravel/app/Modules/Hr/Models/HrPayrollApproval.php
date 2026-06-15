<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayrollApproval extends Model
{
    protected $table = 'hr_payroll_approvals';

    protected $fillable = [
        'payroll_run_id','stage','action_by','notes'
    ];
    protected $casts = [
        
    ];
}
