<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    protected $fillable = [
        'student_registration_fee',
        'registration_fee_currency',
        'registration_fee_period',
        'per_student_license_fee',
        'per_student_license_currency',
        'per_student_license_period',
    ];

    protected $casts = [
        'student_registration_fee' => 'float',
        'per_student_license_fee' => 'float',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'student_registration_fee' => 0,
            'registration_fee_currency' => 'USD',
            'registration_fee_period' => 'per_semester',
            'per_student_license_fee' => 0,
            'per_student_license_currency' => 'USD',
            'per_student_license_period' => 'per_semester',
        ]);
    }
}
