<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterLicenseAdjustment extends Model
{
    protected $fillable = [
        'institution_semester_license_id', 'adjustment_type', 'amount',
        'quantity', 'reason', 'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];
}
