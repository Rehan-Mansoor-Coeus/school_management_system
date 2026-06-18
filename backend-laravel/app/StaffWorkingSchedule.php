<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class StaffWorkingSchedule extends Model
{
    protected $fillable = [
        'institution_id',
        'staff_id',
        'weekday',
        'expected_hours',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected $dates = [
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
