<?php

namespace App\Modules\Tasks\Models;

use App\Institution;
use App\User;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'tasks';

    protected $fillable = [
        'institution_id',
        'title',
        'description',
        'priority',
        'start_date',
        'start_time',
        'deadline',
        'deadline_time',
        'status',
        'created_by',
        'category_id',
        'notification_template',
        'schedules_json',
        'is_scheduled',
        'color',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
        'is_scheduled' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function category()
    {
        return $this->belongsTo(TaskCategory::class, 'category_id');
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class, 'task_id');
    }

    public function reminders()
    {
        return $this->hasMany(TaskReminder::class, 'task_id');
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class, 'task_id');
    }
}
