<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetEntry extends Model
{
    protected $fillable = [
        'institution_id',
        'timesheet_id',
        'activity_id',
        'work_date',
        'hours_worked',
        'description',
    ];

    protected $dates = [
        'work_date',
    ];

    public function timesheet()
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function activity()
    {
        return $this->belongsTo(TimesheetActivity::class, 'activity_id');
    }
}
