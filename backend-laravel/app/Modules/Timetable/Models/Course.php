<?php

namespace App\Modules\Timetable\Models;

use App\Department;
use App\Programme;
use App\ProgrammeSemester;
use App\Subject;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $table = 'tt_courses';

    protected $fillable = [
        'institution_id', 'subject_id', 'department_id', 'programme_id', 'programme_semester_id',
        'semester_label', 'code', 'name', 'credit_hours', 'contact_hours', 'practical_hours',
        'laboratory_hours', 'level', 'is_active', 'description', 'created_by',
    ];

    protected $casts = [
        'credit_hours' => 'float',
        'contact_hours' => 'integer',
        'practical_hours' => 'integer',
        'laboratory_hours' => 'integer',
        'is_active' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class, 'programme_id');
    }

    public function programmeSemester()
    {
        return $this->belongsTo(ProgrammeSemester::class, 'programme_semester_id');
    }

    public function assignments()
    {
        return $this->hasMany(CourseAssignment::class, 'course_id');
    }

    public function lessonLogs()
    {
        return $this->hasMany(LessonLog::class, 'course_id');
    }
}
