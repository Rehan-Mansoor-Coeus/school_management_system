<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterLicenseStudentUsage extends Model
{
    protected $table = 'semester_license_student_usage';

    protected $fillable = [
        'institution_semester_license_id', 'student_id', 'user_id', 'status',
        'is_billable', 'added_after_lock', 'first_seen_at', 'removed_at',
    ];

    protected $casts = [
        'is_billable' => 'boolean',
        'added_after_lock' => 'boolean',
        'first_seen_at' => 'datetime',
        'removed_at' => 'datetime',
    ];
}
