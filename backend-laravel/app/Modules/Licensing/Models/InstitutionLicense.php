<?php

namespace App\Modules\Licensing\Models;

use App\Institution;
use App\Module;
use Illuminate\Database\Eloquent\Model;

class InstitutionLicense extends Model
{
    protected $fillable = [
        'institution_id', 'license_plan_id', 'license_type', 'billing_cycle', 'currency',
        'calculated_amount', 'custom_amount', 'discount_amount', 'tax_amount', 'total_amount',
        'amount_paid', 'start_date', 'expiry_date', 'next_billing_date', 'grace_period_end',
        'license_status', 'payment_status', 'auto_renew', 'is_current',
        'max_users_override', 'max_students_override', 'max_teachers_override',
        'max_staff_override', 'max_admins_override', 'license_key', 'assigned_by', 'notes',
    ];

    protected $casts = [
        'calculated_amount' => 'float',
        'custom_amount' => 'float',
        'discount_amount' => 'float',
        'tax_amount' => 'float',
        'total_amount' => 'float',
        'amount_paid' => 'float',
        'auto_renew' => 'boolean',
        'is_current' => 'boolean',
        'start_date' => 'date',
        'expiry_date' => 'date',
        'next_billing_date' => 'date',
        'grace_period_end' => 'date',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function plan()
    {
        return $this->belongsTo(LicensePlan::class, 'license_plan_id');
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'institution_license_modules')
            ->withPivot(['unit_price', 'billing_cycle', 'start_date', 'expiry_date', 'status'])
            ->withTimestamps();
    }

    public function statusHistory()
    {
        return $this->hasMany(LicenseStatusHistory::class, 'institution_license_id');
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function effectiveMaxUsers(): ?int
    {
        if ($this->max_users_override !== null) {
            return (int) $this->max_users_override;
        }

        return $this->plan ? $this->plan->max_users : null;
    }

    public function balance(): float
    {
        return max(0, (float) $this->total_amount - (float) $this->amount_paid);
    }
}
