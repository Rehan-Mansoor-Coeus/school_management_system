<?php

namespace App\Modules\Admissions\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class ApplicationDocument extends Model
{
    protected $table = 'application_documents';

    protected $fillable = [
        'institution_id', 'application_id', 'applicant_id',
        'document_name', 'file_path', 'mime_type', 'file_size',
    ];

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
}
