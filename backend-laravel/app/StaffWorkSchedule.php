<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class StaffWorkSchedule extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'staff_id', 'shift_type_id',
        'day_of_week', 'start_time', 'end_time', 'expected_minutes', 'status',
    ];

    public function shiftType()
    {
        return $this->belongsTo(ShiftType::class);
    }
}
