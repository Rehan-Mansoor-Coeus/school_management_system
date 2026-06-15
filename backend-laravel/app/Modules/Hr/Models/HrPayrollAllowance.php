<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayrollAllowance extends Model
{
    protected $table = 'hr_payroll_allowances';

    protected $fillable = [
        'payroll_item_id','allowance_type_id','label','amount'
    ];
    protected $casts = [
        'amount' => 'decimal:2'
    ];
}
