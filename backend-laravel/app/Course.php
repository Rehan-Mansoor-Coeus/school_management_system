<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'department_id', 'name', 'code', 'description',
        'credit_units', 'lecture_hours', 'practical_hours', 'level',
        'is_required', 'pass_mark', 'lecturer_id', 'is_active',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
