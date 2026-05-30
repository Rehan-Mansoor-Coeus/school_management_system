<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetApproval extends Model
{
    protected $fillable = [
        'institution_id',
        'timesheet_id',
        'timesheet_entry_id',
        'timesheet_type',
        'acted_by',
        'approved_by',
        'action',
        'status',
        'comment',
        'acted_at',
        'approved_at',
    ];

    protected $dates = [
        'acted_at',
        'approved_at',
    ];
}
