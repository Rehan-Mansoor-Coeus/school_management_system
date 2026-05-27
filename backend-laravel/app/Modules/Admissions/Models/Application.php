<?php

namespace App\Modules\Admissions\Models;

use App\Models\User;
use App\Models\Institution;
use App\Models\Programme;
use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use SoftDeletes;

    protected $table = 'applications';

    protected $fillable = [
        'institution_id', 'applicant_id', 'academic_year_id', 'programme_id',
        'application_number', 'status', 'application_fee', 'application_fee_paid',
        'fee_paid_at', 'rejection_reason', 'admission_comment', 'reviewed_by',
        'reviewed_at', 'approved_by', 'approved_at', 'admitted_by', 'admitted_at',
        'admission_letter_sent', 'admission_letter_sent_at', 'admission_accepted',
        'admission_accepted_at'
    ];

    protected $dates = [
        'fee_paid_at', 'reviewed_at', 'approved_at', 'admitted_at',
        'admission_letter_sent_at', 'admission_accepted_at', 'deleted_at'
    ];

    protected $casts = [
        'application_fee_paid' => 'boolean',
        'admission_letter_sent' => 'boolean',
        'admission_accepted' => 'boolean',
    ];

    // Relationships
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

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function admittedBy()
    {
        return $this->belongsTo(User::class, 'admitted_by');
    }

    public function payments()
    {
        return $this->hasMany(ApplicationPayment::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeAdmitted($query)
    {
        return $query->where('status', 'admitted');
    }

    public function scopeByInstitution($query, $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    public function scopeByAcademicYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    // Methods
    public function canReview()
    {
        return $this->status === 'submitted';
    }

    public function canApprove()
    {
        return $this->status === 'under_review';
    }

    public function canAdmit()
    {
        return $this->status === 'approved' && $this->application_fee_paid;
    }

    public function markAsReviewed($userId, $comment = null)
    {
        $this->update([
            'status' => 'under_review',
            'reviewed_by' => $userId,
            'reviewed_at' => now(),
            'admission_comment' => $comment,
        ]);
    }

    public function approve($userId)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function reject($userId, $reason)
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $userId,
            'approved_at' => now(),
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

    public function markAdmissionLetterSent()
    {
        $this->update([
            'admission_letter_sent' => true,
            'admission_letter_sent_at' => now(),
        ]);
    }

    public function markAdmissionAccepted()
    {
        $this->update([
            'admission_accepted' => true,
            'admission_accepted_at' => now(),
            'status' => 'enrolled',
        ]);
    }
}
