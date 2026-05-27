<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetActivity extends Model
{
    protected $fillable = [
        'institution_id',
        'name',
        'code',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
