<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrFinancePayment extends Model
{
    protected $table = 'hr_finance_payments';

    protected $fillable = [
        'institution_id','payroll_run_id','payroll_item_id','amount','status','paid_at','paid_by','notes'
    ];
    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime'
    ];
}
