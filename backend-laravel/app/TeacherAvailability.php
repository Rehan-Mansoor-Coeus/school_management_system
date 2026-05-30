<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'teacher_id',
        'day_of_week', 'start_time', 'end_time', 'expected_minutes', 'status',
    ];
}
