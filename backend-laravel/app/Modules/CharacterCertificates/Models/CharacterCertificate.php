<?php

namespace App\Modules\CharacterCertificates\Models;

use App\Institution;
use App\Student;
use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class CharacterCertificate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'student_id', 'certificate_number', 'purpose',
        'conduct_remarks', 'academic_standing', 'academic_standing_notes',
        'finance_cleared', 'finance_clearance_notes', 'finance_cleared_at', 'finance_cleared_by',
        'library_cleared', 'library_clearance_notes', 'library_cleared_at', 'library_cleared_by',
        'registrar_user_id', 'registrar_name', 'status', 'pdf_path', 'issued_at', 'created_by',
    ];

    protected $casts = [
        'finance_cleared' => 'boolean',
        'library_cleared' => 'boolean',
        'finance_cleared_at' => 'datetime',
        'library_cleared_at' => 'datetime',
        'issued_at' => 'datetime',
    ];

    protected $appends = ['pdf_url'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function registrar()
    {
        return $this->belongsTo(User::class, 'registrar_user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function financeClearee()
    {
        return $this->belongsTo(User::class, 'finance_cleared_by');
    }

    public function libraryClearee()
    {
        return $this->belongsTo(User::class, 'library_cleared_by');
    }

    public function getPdfUrlAttribute()
    {
        if (! $this->pdf_path) {
            return null;
        }

        return url(Storage::disk('public')->url($this->pdf_path));
    }

    public function isReadyToIssue(): bool
    {
        return $this->finance_cleared
            && $this->library_cleared
            && filled($this->conduct_remarks)
            && filled($this->academic_standing)
            && $this->status !== 'issued'
            && $this->status !== 'void';
    }
}
