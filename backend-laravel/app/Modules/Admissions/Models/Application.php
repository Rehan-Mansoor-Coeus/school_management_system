<?php

namespace App\Modules\Admissions\Models;

use App\AcademicYear;
use App\Institution;
use App\Programme;
use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use SoftDeletes;

    protected $table = 'applications';

    protected $fillable = [
        'institution_id', 'applicant_id', 'academic_year_id', 'programme_id',
        'application_number', 'status', 'applicant_signature_path', 'application_fee', 'application_fee_paid',
        'fee_paid_at', 'tuition_fee', 'tuition_fee_paid', 'tuition_paid_at',
        'tuition_verified_by', 'tuition_verified_at',
        'rejection_reason', 'admission_comment', 'department_review_comment',
        'reviewed_by', 'reviewed_at', 'registry_reviewed_by', 'registry_reviewed_at',
        'department_reviewed_by', 'department_reviewed_at',
        'approved_by', 'approved_at', 'admitted_by', 'admitted_at',
        'admission_letter_sent', 'admission_letter_sent_at', 'admission_accepted',
        'admission_accepted_at',
    ];

    protected $dates = [
        'fee_paid_at', 'tuition_paid_at', 'tuition_verified_at',
        'reviewed_at', 'registry_reviewed_at', 'department_reviewed_at',
        'approved_at', 'admitted_at', 'admission_letter_sent_at',
        'admission_accepted_at', 'deleted_at',
    ];

    protected $casts = [
        'application_fee_paid' => 'boolean',
        'tuition_fee_paid' => 'boolean',
        'admission_letter_sent' => 'boolean',
        'admission_accepted' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function registryReviewedBy()
    {
        return $this->belongsTo(User::class, 'registry_reviewed_by');
    }

    public function departmentReviewedBy()
    {
        return $this->belongsTo(User::class, 'department_reviewed_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function admittedBy()
    {
        return $this->belongsTo(User::class, 'admitted_by');
    }

    public function tuitionVerifiedBy()
    {
        return $this->belongsTo(User::class, 'tuition_verified_by');
    }

    public function payments()
    {
        return $this->hasMany(ApplicationPayment::class, 'application_id');
    }

    public function documents()
    {
        return $this->hasMany(ApplicationDocument::class, 'application_id');
    }

    public function agreementAcceptances()
    {
        return $this->hasMany(ApplicationAgreementAcceptance::class, 'application_id');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByInstitution($query, $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    public function canPayApplicationFee()
    {
        return in_array($this->status, ['submitted'], true)
            && ! $this->application_fee_paid
            && ! $this->hasPendingApplicationFeeProof();
    }

    public function canCancelByStudent(): bool
    {
        return $this->status === 'submitted'
            && ! $this->application_fee_paid
            && ! $this->hasPendingApplicationFeeProof();
    }

    public function canUpdateByStudent(): bool
    {
        return $this->canCancelByStudent();
    }

    public function markCancelled(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    public function canSubmitApplicationFeeProof()
    {
        return in_array($this->status, ['submitted'], true)
            && ! $this->application_fee_paid
            && ! $this->hasPendingApplicationFeeProof();
    }

    public function hasPendingApplicationFeeProof()
    {
        return $this->payments()
            ->applicationFee()
            ->pendingProof()
            ->exists();
    }

    public function latestApplicationFeePayment()
    {
        return $this->hasOne(ApplicationPayment::class, 'application_id')
            ->applicationFee()
            ->latest();
    }

    public function latestTuitionPayment()
    {
        return $this->hasOne(ApplicationPayment::class, 'application_id')
            ->where('payment_type', 'tuition')
            ->latest();
    }

    public function hasPendingTuitionProof()
    {
        return $this->payments()
            ->where('payment_type', 'tuition')
            ->pendingProof()
            ->exists();
    }

    public function canSubmitTuitionProof()
    {
        return $this->canPayTuition()
            && ! $this->hasPendingTuitionProof()
            && (float) $this->tuition_fee > 0;
    }

    public function syncFeesFromProgramme(): void
    {
        if (! $this->relationLoaded('programme')) {
            $this->load('programme');
        }

        if (! $this->programme) {
            return;
        }

        $updates = [];

        if ((float) $this->tuition_fee <= 0 && (float) ($this->programme->tuition_fee ?? 0) > 0) {
            $updates['tuition_fee'] = $this->programme->tuition_fee;
        }

        if ((float) $this->application_fee <= 0 && (float) ($this->programme->application_fee ?? 0) > 0) {
            $updates['application_fee'] = $this->programme->application_fee;
        }

        if ($updates !== []) {
            $this->update($updates);
            $this->refresh();
        }
    }

    /**
     * Ensure completed card/online payments appear in the payments list even if only flags were set.
     */
    public function syncPaymentRecordsFromFlags(): void
    {
        if ($this->application_fee_paid
            && ! $this->payments()->applicationFee()->where('status', 'completed')->exists()) {
            ApplicationPayment::create([
                'institution_id' => $this->institution_id,
                'application_id' => $this->id,
                'reference_number' => 'PAY-APP-'.$this->id.'-'.time(),
                'payment_type' => 'application_fee',
                'payment_method' => 'stripe',
                'amount' => $this->application_fee,
                'status' => 'completed',
                'paid_at' => $this->fee_paid_at ?? now(),
                'description' => 'Application fee for '.$this->application_number,
            ]);
        }

        if ($this->tuition_fee_paid
            && ! $this->payments()->where('payment_type', 'tuition')->where('status', 'completed')->exists()) {
            ApplicationPayment::create([
                'institution_id' => $this->institution_id,
                'application_id' => $this->id,
                'reference_number' => 'PAY-TUI-'.$this->id.'-'.time(),
                'payment_type' => 'tuition',
                'payment_method' => 'stripe',
                'amount' => $this->tuition_fee,
                'status' => 'completed',
                'paid_at' => $this->tuition_paid_at ?? now(),
                'description' => 'Tuition fee for '.$this->application_number,
            ]);
        }
    }

    public function canRegistryReview()
    {
        return $this->status === 'submitted' && $this->application_fee_paid;
    }

    public function canDepartmentReview()
    {
        return $this->status === 'registry_reviewed';
    }

    public function canAdmit()
    {
        return $this->status === 'department_approved';
    }

    public function canResendAdmissionLetter()
    {
        return in_array($this->status, ['admitted', 'accepted', 'tuition_paid', 'enrolled'], true);
    }

    public function canAcceptAdmission()
    {
        return $this->status === 'admitted' && ! $this->admission_accepted;
    }

    public function canPayTuition()
    {
        return $this->status === 'accepted'
            && $this->admission_accepted
            && ! $this->tuition_fee_paid
            && (float) $this->tuition_fee > 0;
    }

    public function markRegistryReviewed($userId, $comment = null)
    {
        $this->update([
            'status' => 'registry_reviewed',
            'registry_reviewed_by' => $userId,
            'registry_reviewed_at' => now(),
            'reviewed_by' => $userId,
            'reviewed_at' => now(),
            'admission_comment' => $comment,
        ]);
    }

    public function markDepartmentApproved($userId, $comment = null)
    {
        $this->update([
            'status' => 'department_approved',
            'department_reviewed_by' => $userId,
            'department_reviewed_at' => now(),
            'department_review_comment' => $comment,
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function markDepartmentRejected($userId, $reason)
    {
        $this->update([
            'status' => 'rejected',
            'department_reviewed_by' => $userId,
            'department_reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function markRegistryRejected($userId, $reason)
    {
        $this->update([
            'status' => 'rejected',
            'registry_reviewed_by' => $userId,
            'registry_reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function admit($userId)
    {
        $this->update([
            'status' => 'admitted',
            'admitted_by' => $userId,
            'admitted_at' => now(),
        ]);
    }

    public function markAdmissionAccepted()
    {
        $this->update([
            'admission_accepted' => true,
            'admission_accepted_at' => now(),
            'status' => 'accepted',
        ]);
    }

    public function markTuitionPaid()
    {
        $this->update([
            'tuition_fee_paid' => true,
            'tuition_paid_at' => now(),
            'status' => 'tuition_paid',
        ]);
    }

    public function markTuitionVerified($userId)
    {
        $this->update([
            'tuition_verified_by' => $userId,
            'tuition_verified_at' => now(),
            'status' => 'enrolled',
        ]);
    }

    public function markAdmissionLetterSent()
    {
        $this->update([
            'admission_letter_sent' => true,
            'admission_letter_sent_at' => now(),
        ]);
    }
}
