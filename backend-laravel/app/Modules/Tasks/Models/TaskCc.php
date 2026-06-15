<?php

namespace App\Modules\Tasks\Models;

use App\User;
use Illuminate\Database\Eloquent\Model;

class TaskCc extends Model
{
    protected $table = 'task_cc';

    protected $fillable = [
        'task_id',
        'user_id',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
