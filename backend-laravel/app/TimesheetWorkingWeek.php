<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetWorkingWeek extends Model
{
    protected $fillable = [
        'institution_id',
        'user_id',
        'day_of_week',
        'is_working_day',
        'start_time',
        'end_time',
        'break_minutes',
        'expected_minutes',
    ];

    protected $casts = [
        'is_working_day' => 'boolean',
        'break_minutes' => 'integer',
        'expected_minutes' => 'integer',
    ];
}
