<?php

namespace App\Modules\Tasks\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class TaskCategory extends Model
{
    protected $table = 'task_categories';

    protected $fillable = [
        'institution_id',
        'name',
        'description',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
