<?php

namespace App\Modules\Admissions\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class ApplicationDocument extends Model
{
    protected $table = 'application_documents';

    protected $fillable = [
        'institution_id', 'application_id', 'applicant_id',
        'programme_required_document_id',
        'document_name', 'comment', 'file_path', 'mime_type', 'file_size',
        'review_status', 'review_comment', 'reviewed_by', 'reviewed_at',
    ];

    protected $dates = ['reviewed_at'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function programmeRequiredDocument()
    {
        return $this->belongsTo(\App\ProgrammeRequiredDocument::class, 'programme_required_document_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(\App\User::class, 'reviewed_by');
    }

    public function isPendingReview(): bool
    {
        return $this->review_status === 'pending' || $this->review_status === null;
    }
}
