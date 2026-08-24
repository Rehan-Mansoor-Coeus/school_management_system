<?php

namespace App;

use App\Modules\Licensing\Models\LicensePlan;
use Illuminate\Database\Eloquent\Model;

class InstitutionRegistrationRequest extends Model
{
    protected $fillable = [
        'institution_name',
        'country',
        'city',
        'contact_person',
        'phone',
        'email',
        'student_population',
        'website',
        'message',
        'status',
        'institution_id',
        'license_plan_id',
        'reviewed_by',
        'reviewed_at',
        'admin_notes',
        'admin_setup_token_hash',
        'admin_setup_token_expires_at',
        'admin_setup_completed_at',
    ];

    protected $dates = ['reviewed_at', 'admin_setup_token_expires_at', 'admin_setup_completed_at'];

    protected $hidden = [
        'admin_setup_token_hash',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function licensePlan()
    {
        return $this->belongsTo(LicensePlan::class, 'license_plan_id');
    }
}
