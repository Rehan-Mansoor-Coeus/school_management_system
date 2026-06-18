<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrLetterTemplate extends Model
{
    protected $table = 'hr_letter_templates';

    protected $fillable = [
        'institution_id','letter_type','name','subject','body','is_default','is_active'
    ];
    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean'
    ];
}
