<?php

namespace App\Modules\Contracts\Models;

use App\Student;
use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'template_id', 'document_type_id', 'reference_number', 'verification_code',
        'title', 'category', 'recipient_type',
        'status', 'user_id', 'student_id', 'hr_staff_profile_id', 'recipient_name', 'recipient_email',
        'recipient_phone', 'body_html', 'merge_data', 'signer_data', 'metadata', 'start_date', 'end_date',
        'signature_path', 'signed_at', 'signed_ip', 'signed_user_agent', 'executed_pdf_path',
        'executed_at', 'created_by', 'approved_by', 'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'merge_data' => 'array',
        'signer_data' => 'array',
        'metadata' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'signed_at' => 'datetime',
        'executed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(ContractTemplate::class, 'template_id');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function signatories()
    {
        return $this->hasMany(ContractSignatory::class);
    }

    public function approvals()
    {
        return $this->hasMany(ContractApproval::class);
    }

    public function documents()
    {
        return $this->hasMany(ContractDocument::class);
    }

    public function accessTokens()
    {
        return $this->hasMany(ContractAccessToken::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(ContractStatusLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(ContractNotification::class);
    }
}
