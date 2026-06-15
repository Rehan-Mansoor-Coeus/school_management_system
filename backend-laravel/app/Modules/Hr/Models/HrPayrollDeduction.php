<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayrollDeduction extends Model
{
    protected $table = 'hr_payroll_deductions';

    protected $fillable = [
        'payroll_item_id','deduction_type_id','label','amount'
    ];
    protected $casts = [
        'amount' => 'decimal:2'
    ];
}
