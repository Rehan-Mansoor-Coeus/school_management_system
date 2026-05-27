<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetPeriod extends Model
{
    protected $fillable = [
        'institution_id', 'academic_year_id', 'period_type', 'name', 'starts_on', 'ends_on', 'is_active',
    ];

    protected $dates = ['starts_on', 'ends_on'];

    protected $casts = ['is_active' => 'boolean'];
}
