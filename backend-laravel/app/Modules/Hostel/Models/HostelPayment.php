<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use App\Student;
use Illuminate\Database\Eloquent\Model;

class HostelPayment extends Model
{
    protected $table = 'hostel_payments';

    protected $fillable = [
        'institution_id', 'student_id', 'allocation_id', 'reference', 'amount',
        'amount_paid', 'status', 'payment_method', 'payment_reference', 'notes',
        'recorded_by', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function allocation()
    {
        return $this->belongsTo(HostelAllocation::class, 'allocation_id');
    }

    public function recorder()
    {
        return $this->belongsTo(\App\User::class, 'recorded_by');
    }
}
