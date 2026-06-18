<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetCourse extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'name', 'code', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];
}
