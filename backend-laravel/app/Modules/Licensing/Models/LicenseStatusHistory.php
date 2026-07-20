<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseStatusHistory extends Model
{
    protected $table = 'license_status_history';

    protected $fillable = [
        'institution_license_id', 'old_status', 'new_status', 'field', 'reason', 'changed_by', 'ip_address',
    ];

    public function license()
    {
        return $this->belongsTo(InstitutionLicense::class, 'institution_license_id');
    }
}
