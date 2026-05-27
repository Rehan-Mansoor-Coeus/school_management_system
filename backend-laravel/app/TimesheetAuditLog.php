<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetAuditLog extends Model
{
    protected $fillable = [
        'institution_id',
        'timesheet_id',
        'entry_id',
        'entity_type',
        'entity_id',
        'actor_id',
        'event',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
