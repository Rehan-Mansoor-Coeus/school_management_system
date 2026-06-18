<?php

namespace App\Modules\Tasks\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class TaskMessageTemplate extends Model
{
    protected $table = 'task_message_templates';

    protected $fillable = [
        'institution_id',
        'name',
        'subject',
        'body',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
