<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CourseContactHourPlan extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'academic_year_id', 'period_id',
        'course_id', 'class_id', 'required_contact_hours', 'scheduled_contact_hours',
        'completed_contact_hours', 'remaining_contact_hours', 'preferred_shift_duration_minutes', 'status',
    ];

    public function course()
    {
        return $this->belongsTo(TimesheetCourse::class, 'course_id');
    }

    public function classModel()
    {
        return $this->belongsTo(TimesheetClass::class, 'class_id');
    }

    public function teachers()
    {
        return $this->hasMany(CourseContactHourTeacher::class);
    }

    public function teacherSchedules()
    {
        return $this->hasMany(TeacherSchedule::class);
    }

    public function teachingEntries()
    {
        return $this->hasMany(TeachingTimesheetEntry::class);
    }
}
