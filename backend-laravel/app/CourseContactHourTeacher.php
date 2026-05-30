<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CourseContactHourTeacher extends Model
{
    protected $fillable = [
        'institution_id', 'course_contact_hour_plan_id', 'teacher_id',
        'assigned_contact_hours', 'completed_contact_hours', 'status',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
