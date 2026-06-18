<?php

namespace App\Modules\Tasks\Models;

use Illuminate\Database\Eloquent\Model;

class TaskReminder extends Model
{
    protected $table = 'task_reminders';

    protected $fillable = [
        'task_id',
        'reminder_time',
        'is_sent',
    ];

    protected $casts = [
        'reminder_time' => 'datetime',
        'is_sent' => 'boolean',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }
}
