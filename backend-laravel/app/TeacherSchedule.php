<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TeacherSchedule extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'academic_year_id', 'period_id',
        'teacher_id', 'course_id', 'class_id', 'shift_type_id', 'course_contact_hour_plan_id',
        'day_of_week', 'start_time', 'end_time', 'expected_minutes', 'expected_contact_hours',
        'schedule_source', 'status',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function course()
    {
        return $this->belongsTo(TimesheetCourse::class, 'course_id');
    }

    public function classModel()
    {
        return $this->belongsTo(TimesheetClass::class, 'class_id');
    }

    public function shiftType()
    {
        return $this->belongsTo(ShiftType::class);
    }
}
