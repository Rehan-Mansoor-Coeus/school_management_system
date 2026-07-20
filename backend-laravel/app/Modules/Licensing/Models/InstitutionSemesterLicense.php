<?php

namespace App\Modules\Licensing\Models;

use App\AcademicYear;
use App\Institution;
use Illuminate\Database\Eloquent\Model;

class InstitutionSemesterLicense extends Model
{
    protected $fillable = [
        'institution_id', 'institution_license_id', 'license_plan_id', 'academic_year_id', 'semester_id',
        'semester_name', 'currency', 'price_per_student', 'minimum_billable_students',
        'estimated_students', 'projected_students', 'locked_students',
        'estimated_total', 'required_down_payment', 'down_payment_paid', 'locked_total',
        'balance_due', 'amount_paid', 'status', 'payment_status',
        'student_count_lock_date', 'locked_at', 'reconciled_at', 'created_by', 'notes',
    ];

    protected $casts = [
        'price_per_student' => 'float',
        'estimated_total' => 'float',
        'required_down_payment' => 'float',
        'down_payment_paid' => 'float',
        'locked_total' => 'float',
        'balance_due' => 'float',
        'amount_paid' => 'float',
        'student_count_lock_date' => 'date',
        'locked_at' => 'datetime',
        'reconciled_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function plan()
    {
        return $this->belongsTo(LicensePlan::class, 'license_plan_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function usage()
    {
        return $this->hasMany(SemesterLicenseStudentUsage::class, 'institution_semester_license_id');
    }

    public function snapshots()
    {
        return $this->hasMany(SemesterLicenseCountSnapshot::class, 'institution_semester_license_id');
    }

    public function adjustments()
    {
        return $this->hasMany(SemesterLicenseAdjustment::class, 'institution_semester_license_id');
    }

    public function invoices()
    {
        return $this->hasMany(LicenseInvoice::class, 'institution_semester_license_id');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'institution_license_id' => $this->institution_license_id,
            'license_plan_id' => $this->license_plan_id,
            'plan' => $this->plan ? [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'code' => $this->plan->code,
            ] : null,
            'academic_year_id' => $this->academic_year_id,
            'academic_year' => $this->academicYear ? $this->academicYear->name : null,
            'semester_id' => $this->semester_id,
            'semester_name' => $this->semester_name,
            'currency' => $this->currency,
            'price_per_student' => (float) $this->price_per_student,
            'minimum_billable_students' => (int) $this->minimum_billable_students,
            'estimated_students' => (int) $this->estimated_students,
            'projected_students' => (int) $this->projected_students,
            'locked_students' => $this->locked_students,
            'estimated_total' => (float) $this->estimated_total,
            'required_down_payment' => (float) $this->required_down_payment,
            'down_payment_paid' => (float) $this->down_payment_paid,
            'locked_total' => $this->locked_total !== null ? (float) $this->locked_total : null,
            'balance_due' => (float) $this->balance_due,
            'amount_paid' => (float) $this->amount_paid,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'student_count_lock_date' => optional($this->student_count_lock_date)->toDateString(),
            'locked_at' => optional($this->locked_at)->toIso8601String(),
            'reconciled_at' => optional($this->reconciled_at)->toIso8601String(),
            'notes' => $this->notes,
        ];
    }
}
