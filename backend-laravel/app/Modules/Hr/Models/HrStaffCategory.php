<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrStaffCategory extends Model
{
    protected $table = 'hr_staff_categories';

    protected $fillable = [
        'institution_id','code','name','description','is_active'
    ];
    protected $casts = [
        'is_active' => 'boolean'
    ];
}
