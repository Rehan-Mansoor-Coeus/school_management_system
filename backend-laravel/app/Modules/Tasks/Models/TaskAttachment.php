<?php

namespace App\Modules\Tasks\Models;

use App\Support\StorageUrl;
use Illuminate\Database\Eloquent\Model;

class TaskAttachment extends Model
{
    protected $table = 'task_attachments';

    protected $fillable = [
        'task_id',
        'update_id',
        'file_name',
        'file_url',
        'attachment_type',
    ];

    protected $appends = [
        'public_url',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function update()
    {
        return $this->belongsTo(TaskUpdate::class, 'update_id');
    }

    public function getPublicUrlAttribute()
    {
        return StorageUrl::public($this->file_url);
    }
}
