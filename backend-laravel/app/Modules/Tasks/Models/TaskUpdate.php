<?php

namespace App\Modules\Tasks\Models;

use Illuminate\Database\Eloquent\Model;

class TaskUpdate extends Model
{
    protected $table = 'task_updates';

    protected $fillable = [
        'assignment_id',
        'progress',
        'comment',
    ];

    protected $casts = [
        'progress' => 'integer',
    ];

    public function assignment()
    {
        return $this->belongsTo(TaskAssignment::class, 'assignment_id');
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class, 'update_id');
    }
}
