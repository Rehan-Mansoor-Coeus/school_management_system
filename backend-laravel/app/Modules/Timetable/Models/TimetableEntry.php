<?php

namespace App\Modules\Timetable\Models;

use App\Department;
use App\Programme;
use App\ProgrammeSemester;
use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimetableEntry extends Model
{
    use SoftDeletes;

    protected $table = 'tt_timetable_entries';

    protected $fillable = [
        'institution_id', 'department_id', 'programme_id', 'programme_semester_id', 'academic_year',
        'course_id', 'teacher_id', 'classroom_id', 'assignment_id', 'day_of_week', 'start_time',
        'end_time', 'source', 'status', 'approved_by', 'approved_at', 'created_by',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'approved_at' => 'datetime',
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
}
