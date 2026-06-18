<?php

namespace App;

use App\Services\Fees\FeeStatusService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'student_id', 'programme_id', 'programme_level_id', 'programme_semester_id',
        'semester_id', 'semester_name', 'invoice_number', 'tuition_fee', 'registration_fee',
        'hostel_fee', 'library_fee', 'other_charges', 'total_amount', 'amount_paid', 'balance',
        'status', 'due_date', 'latest_payment_date', 'paid_date', 'remarks',
    ];

    protected $casts = [
        'due_date' => 'date',
        'latest_payment_date' => 'date',
        'paid_date' => 'date',
    ];

    protected $appends = ['computed_status'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function programmeLevel()
    {
        return $this->belongsTo(ProgrammeLevel::class);
    }

    public function programmeSemester()
    {
        return $this->belongsTo(ProgrammeSemester::class);
    }

    public function payments()
    {
        return $this->hasMany(StudentFeePayment::class, 'fee_id');
    }

    public function getComputedStatusAttribute(): string
    {
        return (new FeeStatusService())->calculate($this);
    }

    public function recalculateBalances(): self
    {
        $paid = (float) $this->payments()->where('status', 'completed')->sum('amount');
        $total = (float) $this->total_amount;
        $balance = max(0, round($total - $paid, 2));

        $this->amount_paid = $paid;
        $this->balance = $balance;
        $this->status = (new FeeStatusService())->calculate($this);
        if ($balance <= 0) {
            $this->paid_date = $this->paid_date ?: now()->toDateString();
        }
        $this->save();

        return $this->fresh();
    }
}
