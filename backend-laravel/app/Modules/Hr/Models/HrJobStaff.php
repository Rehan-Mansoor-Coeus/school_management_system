<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrJobStaff extends Model
{
    protected $table = 'hr_job_staff';

    protected $fillable = [
        'job_id','staff_profile_id','daily_rate','days_worked','day_status','partial_fraction','notes'
    ];
    protected $casts = [
        'daily_rate' => 'decimal:2',
        'days_worked' => 'decimal:2',
        'partial_fraction' => 'decimal:2'
    ];
}
