<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseAdjustment extends Model
{
    protected $fillable = [
        'institution_license_id',
        'adjustment_type',
        'amount',
        'currency',
        'reason',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function license()
    {
        return $this->belongsTo(InstitutionLicense::class, 'institution_license_id');
    }
}
