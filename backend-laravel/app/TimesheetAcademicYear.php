<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetAcademicYear extends Model
{
    protected $fillable = ['institution_id', 'name', 'starts_on', 'ends_on', 'is_active'];

    protected $dates = ['starts_on', 'ends_on'];

    protected $casts = ['is_active' => 'boolean'];
}
