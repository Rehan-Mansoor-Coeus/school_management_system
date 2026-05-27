<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimetableSuggestion extends Model
{
    protected $fillable = [
        'institution_id', 'campus_id', 'department_id', 'course_contact_hour_plan_id',
        'generated_by', 'suggestion_payload', 'total_required_contact_hours',
        'total_suggested_contact_hours', 'remaining_unscheduled_contact_hours', 'status',
    ];

    protected $casts = [
        'suggestion_payload' => 'array',
    ];
}
