<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetEntry extends Model
{
    protected $fillable = [
        'institution_id',
        'user_id',
        'timesheet_id',
        'activity_id',
        'work_date',
        'hours_worked',
        'minutes',
        'description',
        'notes',
        'status',
        'is_overtime',
        'overtime_hours',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'work_date' => 'date',
        'is_overtime' => 'boolean',
        'overtime_hours' => 'decimal:2',
        'hours_worked' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function timesheet()
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function activity()
    {
        return $this->belongsTo(TimesheetActivity::class, 'activity_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
