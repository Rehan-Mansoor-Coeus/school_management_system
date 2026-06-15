<?php

namespace App\Modules\Tasks\Models;

use Illuminate\Database\Eloquent\Model;

class TaskNotificationQueue extends Model
{
    protected $table = 'task_notification_queue';

    protected $fillable = [
        'task_id',
        'assignment_id',
        'scheduled_at',
        'status',
        'sent_at',
        'last_error',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function assignment()
    {
        return $this->belongsTo(TaskAssignment::class, 'assignment_id');
    }
}
