<?php

namespace App\Modules\Tasks\Models;

use App\User;
use Illuminate\Database\Eloquent\Model;

class TaskAssignment extends Model
{
    protected $table = 'task_assignments';

    protected $fillable = [
        'task_id',
        'user_id',
        'status',
        'progress',
        'accepted_at',
        'declined_at',
        'completed_at',
        'last_update_at',
        'invite_token',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'declined_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_update_at' => 'datetime',
        'progress' => 'integer',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function updates()
    {
        return $this->hasMany(TaskUpdate::class, 'assignment_id');
    }
}
