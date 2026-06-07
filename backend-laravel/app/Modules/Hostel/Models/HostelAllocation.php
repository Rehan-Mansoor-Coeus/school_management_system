<?php

namespace App\Modules\Hostel\Models;

use App\AcademicYear;
use App\Institution;
use App\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HostelAllocation extends Model
{
    use SoftDeletes;

    protected $table = 'hostel_allocations';

    protected $fillable = [
        'institution_id', 'student_id', 'room_id', 'bed_id', 'academic_year_id',
        'registration_id', 'allocation_date', 'check_in_date', 'check_out_date',
        'status', 'remarks',
    ];

    protected $casts = [
        'allocation_date' => 'date',
        'check_in_date' => 'date',
        'check_out_date' => 'date',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function room()
    {
        return $this->belongsTo(HostelRoom::class, 'room_id');
    }

    public function bed()
    {
        return $this->belongsTo(HostelBed::class, 'bed_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function registration()
    {
        return $this->belongsTo(HostelRegistration::class, 'registration_id');
    }

    public function clearance()
    {
        return $this->hasOne(HostelClearance::class, 'allocation_id');
    }

    public function payments()
    {
        return $this->hasMany(HostelPayment::class, 'allocation_id');
    }
}
