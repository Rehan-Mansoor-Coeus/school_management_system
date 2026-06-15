<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrDeductionType extends Model
{
    protected $table = 'hr_deduction_types';

    protected $fillable = [
        'institution_id','code','name','default_amount','is_active'
    ];
    protected $casts = [
        'default_amount' => 'decimal:2',
        'is_active' => 'boolean'
    ];
}
