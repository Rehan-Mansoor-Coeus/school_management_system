<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Timesheet extends Model
{
    protected $fillable = [
        'institution_id',
        'staff_id',
        'week_start_date',
        'week_end_date',
        'status',
        'total_submitted_hours',
        'total_expected_hours',
        'overtime_hours',
        'under_time_hours',
        'submitted_at',
        'approved_at',
        'approved_by',
        'rejection_reason',
        'correction_reason',
    ];

    protected $dates = [
        'week_start_date',
        'week_end_date',
        'submitted_at',
        'approved_at',
    ];

    public function entries()
    {
        return $this->hasMany(TimesheetEntry::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
