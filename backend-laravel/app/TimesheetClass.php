<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetClass extends Model
{
    protected $table = 'timesheet_classes';

    protected $fillable = [
        'institution_id', 'campus_id', 'name', 'level', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];
}
