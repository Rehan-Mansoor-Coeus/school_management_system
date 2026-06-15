<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPositionRate extends Model
{
    protected $table = 'hr_position_rates';

    protected $fillable = [
        'institution_id','position','daily_rate','is_active'
    ];
    protected $casts = [
        'daily_rate' => 'decimal:2',
        'is_active' => 'boolean'
    ];
}
