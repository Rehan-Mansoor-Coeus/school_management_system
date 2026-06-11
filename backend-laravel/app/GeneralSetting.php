<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    protected $fillable = [
        'student_registration_fee',
        'registration_fee_currency',
        'registration_fee_period',
    ];

    protected $casts = [
        'student_registration_fee' => 'float',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'student_registration_fee' => 2.00,
            'registration_fee_currency' => 'USD',
            'registration_fee_period' => 'per_semester',
        ]);
    }
}
