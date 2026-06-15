<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrInstitutionSetting extends Model
{
    protected $table = 'hr_institution_settings';

    protected $fillable = [
        'institution_id',
        'default_currency',
        'supported_currencies',
        'staff_code_prefix'
    ];
    protected $casts = [
        'supported_currencies' => 'array'
    ];
}
