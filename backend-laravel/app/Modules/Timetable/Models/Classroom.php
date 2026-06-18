<?php

namespace App\Modules\Timetable\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    use SoftDeletes;

    protected $table = 'tt_classrooms';

    protected $fillable = [
        'institution_id', 'name', 'building', 'capacity', 'room_type', 'is_active', 'created_by',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    public const ROOM_TYPES = ['lecture_hall', 'laboratory', 'workshop', 'computer_lab', 'seminar_room'];
}
