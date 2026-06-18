<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class StaffTimesheetEntry extends Model
{
    protected $fillable = [
        'institution_id', 'staff_id', 'staff_work_schedule_id', 'date', 'activity_id',
        'actual_start_time', 'actual_end_time', 'actual_minutes', 'description', 'remarks', 'status',
    ];

    protected $dates = ['date'];

    public function activity()
    {
        return $this->belongsTo(TimesheetActivity::class, 'activity_id');
    }
}
