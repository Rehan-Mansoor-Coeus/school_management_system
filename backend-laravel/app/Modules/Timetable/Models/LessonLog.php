<?php

namespace App\Modules\Timetable\Models;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LessonLog extends Model
{
    protected $table = 'tt_lesson_logs';

    protected $fillable = [
        'institution_id', 'course_id', 'assignment_id', 'timetable_entry_id', 'teacher_id',
        'programme_semester_id', 'lesson_date', 'start_time', 'end_time', 'duration_hours',
        'topic', 'remarks', 'created_by',
    ];

    protected $casts = [
        'lesson_date' => 'date',
        'duration_hours' => 'float',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function assignment()
    {
        return $this->belongsTo(CourseAssignment::class, 'assignment_id');
    }
}
