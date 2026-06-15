<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrAdvancePayment extends Model
{
    protected $table = 'hr_advance_payments';

    protected $fillable = [
        'institution_id','staff_profile_id','job_id','payroll_item_id','amount','paid_date','reason','approved_by','balance_remaining','status'
    ];
    protected $casts = [
        'amount' => 'decimal:2',
        'balance_remaining' => 'decimal:2',
        'paid_date' => 'date'
    ];
}
