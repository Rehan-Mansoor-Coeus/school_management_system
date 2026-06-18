<?php

namespace App\Modules\Timetable\Models;

use App\User;
use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    protected $table = 'tt_teacher_availability';

    protected $fillable = [
        'institution_id', 'teacher_id', 'day_of_week', 'is_available', 'start_time', 'end_time',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_available' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
