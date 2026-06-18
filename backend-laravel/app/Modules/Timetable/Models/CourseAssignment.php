<?php

namespace App\Modules\Timetable\Models;

use App\Programme;
use App\ProgrammeSemester;
use App\User;
use Illuminate\Database\Eloquent\Model;

class CourseAssignment extends Model
{
    protected $table = 'tt_course_assignments';

    protected $fillable = [
        'institution_id', 'course_id', 'teacher_id', 'classroom_id', 'programme_id',
        'programme_semester_id', 'academic_year', 'expected_contact_hours',
        'completed_contact_hours', 'is_active', 'created_by',
    ];

    protected $casts = [
        'expected_contact_hours' => 'integer',
        'completed_contact_hours' => 'float',
        'is_active' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class, 'programme_id');
    }

    public function programmeSemester()
    {
        return $this->belongsTo(ProgrammeSemester::class, 'programme_semester_id');
    }
}
