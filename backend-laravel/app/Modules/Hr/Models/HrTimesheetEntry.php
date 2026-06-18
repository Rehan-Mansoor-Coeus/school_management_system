<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrTimesheetEntry extends Model
{
    protected $table = 'hr_timesheet_entries';

    protected $fillable = [
        'institution_id','staff_profile_id','job_id','entry_date','hours_worked','day_fraction','status','notes','confirmed_by'
    ];
    protected $casts = [
        'entry_date' => 'date',
        'hours_worked' => 'decimal:2',
        'day_fraction' => 'decimal:2'
    ];
}
