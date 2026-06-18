<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class FeeReminder extends Model
{
    protected $fillable = [
        'institution_id', 'created_by', 'title', 'message', 'reminder_type',
        'status', 'scheduled_at', 'sent_at', 'filters', 'recipient_count',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'filters' => 'array',
    ];
}
