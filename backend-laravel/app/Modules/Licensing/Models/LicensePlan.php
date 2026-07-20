<?php

namespace App\Modules\Licensing\Models;

use App\Module;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LicensePlan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'description', 'license_type', 'pricing_model', 'billing_cycle', 'currency',
        'base_price', 'setup_fee', 'renewal_fee', 'late_fee', 'trial_days', 'grace_period_days',
        'max_users', 'max_students', 'max_teachers', 'max_staff', 'max_admins', 'max_storage',
        'price_per_student', 'student_billing_period', 'minimum_billable_students',
        'down_payment_type', 'down_payment_value', 'minimum_down_payment',
        'student_count_method', 'student_count_lock_rule', 'additional_student_rule',
        'withdrawn_student_rule', 'balance_due_rule', 'activation_rule',
        'count_suspended_students', 'count_deferred_students', 'count_withdrawn_students',
        'count_graduated_students', 'status', 'is_featured', 'display_order', 'created_by',
    ];

    protected $casts = [
        'base_price' => 'float',
        'setup_fee' => 'float',
        'renewal_fee' => 'float',
        'late_fee' => 'float',
        'price_per_student' => 'float',
        'down_payment_value' => 'float',
        'minimum_down_payment' => 'float',
        'is_featured' => 'boolean',
        'count_suspended_students' => 'boolean',
        'count_deferred_students' => 'boolean',
        'count_withdrawn_students' => 'boolean',
        'count_graduated_students' => 'boolean',
    ];

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'license_plan_modules')
            ->withTimestamps();
    }

    public function institutionLicenses()
    {
        return $this->hasMany(InstitutionLicense::class, 'license_plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'license_type' => $this->license_type,
            'pricing_model' => $this->pricing_model,
            'billing_cycle' => $this->billing_cycle,
            'currency' => $this->currency,
            'base_price' => $this->base_price,
            'setup_fee' => $this->setup_fee,
            'renewal_fee' => $this->renewal_fee,
            'late_fee' => $this->late_fee,
            'trial_days' => $this->trial_days,
            'grace_period_days' => $this->grace_period_days,
            'max_users' => $this->max_users,
            'max_students' => $this->max_students,
            'max_teachers' => $this->max_teachers,
            'max_staff' => $this->max_staff,
            'max_admins' => $this->max_admins,
            'max_storage' => $this->max_storage,
            'price_per_student' => $this->price_per_student,
            'student_billing_period' => $this->student_billing_period,
            'minimum_billable_students' => $this->minimum_billable_students,
            'down_payment_type' => $this->down_payment_type,
            'down_payment_value' => $this->down_payment_value,
            'minimum_down_payment' => $this->minimum_down_payment,
            'student_count_method' => $this->student_count_method,
            'student_count_lock_rule' => $this->student_count_lock_rule,
            'additional_student_rule' => $this->additional_student_rule,
            'withdrawn_student_rule' => $this->withdrawn_student_rule,
            'balance_due_rule' => $this->balance_due_rule,
            'activation_rule' => $this->activation_rule,
            'count_suspended_students' => (bool) $this->count_suspended_students,
            'count_deferred_students' => (bool) $this->count_deferred_students,
            'count_withdrawn_students' => (bool) $this->count_withdrawn_students,
            'count_graduated_students' => (bool) $this->count_graduated_students,
            'status' => $this->status,
            'is_featured' => (bool) $this->is_featured,
            'display_order' => $this->display_order,
            'modules' => $this->relationLoaded('modules')
                ? $this->modules->map(function ($m) {
                    return ['id' => $m->id, 'key' => $m->key, 'name' => $m->name];
                })->values()->all()
                : [],
            'module_ids' => $this->relationLoaded('modules')
                ? $this->modules->pluck('id')->values()->all()
                : [],
        ];
    }
}
