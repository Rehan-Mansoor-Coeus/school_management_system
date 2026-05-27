<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ShiftType extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'name', 'description',
        'default_duration_minutes', 'is_teaching_shift', 'is_staff_shift', 'status',
    ];

    protected $casts = [
        'is_teaching_shift' => 'boolean',
        'is_staff_shift' => 'boolean',
    ];
}
