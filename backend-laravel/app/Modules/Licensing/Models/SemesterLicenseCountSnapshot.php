<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterLicenseCountSnapshot extends Model
{
    protected $fillable = [
        'institution_semester_license_id', 'snapshot_type', 'student_count',
        'billable_count', 'amount', 'reason', 'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];
}
