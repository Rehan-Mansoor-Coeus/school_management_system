<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class InstitutionSetting extends Model
{
    protected $fillable = [
        'institution_id',
        'academic_structure',
        'fee_structure',
        'grading_system',
        'academic_calendar',
        'payment_settings',
        'student_registration_fee',
        'registration_fee_currency',
        'registration_fee_period',
    ];

    protected $casts = [
        'academic_structure' => 'array',
        'fee_structure' => 'array',
        'grading_system' => 'array',
        'academic_calendar' => 'array',
        'payment_settings' => 'array',
        'student_registration_fee' => 'float',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}

