<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TeachingTimesheetEntry extends Model
{
    protected $fillable = [
        'institution_id', 'teacher_id', 'teacher_schedule_id', 'course_contact_hour_plan_id',
        'course_id', 'class_id', 'date', 'scheduled_start_time', 'scheduled_end_time',
        'actual_start_time', 'actual_end_time', 'actual_minutes', 'actual_contact_hours',
        'topic_taught', 'sub_topic', 'activity_description', 'remarks', 'status',
    ];

    protected $dates = ['date'];

    public function schedule()
    {
        return $this->belongsTo(TeacherSchedule::class, 'teacher_schedule_id');
    }
}
