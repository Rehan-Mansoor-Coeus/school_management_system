<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrStaffProfile extends Model
{
    protected $table = 'hr_staff_profiles';

    protected $fillable = [
        'institution_id','user_id','staff_code','first_name','last_name','email','phone','category_id','position','department','payment_type','daily_rate','monthly_salary','contract_start','contract_end','hire_date','bank_name','bank_account','status','notes','created_by'
    ];
    protected $casts = [
        'daily_rate' => 'decimal:2',
        'monthly_salary' => 'decimal:2',
        'contract_start' => 'date',
        'contract_end' => 'date',
        'hire_date' => 'date'
    ];
}
