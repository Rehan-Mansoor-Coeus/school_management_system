<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrPayslip extends Model
{
    protected $table = 'hr_payslips';

    protected $fillable = [
        'payroll_item_id','verification_code','pdf_path','sent_email_at','sent_whatsapp_at','generated_at'
    ];
    public $timestamps = false;

    protected $casts = [
        'sent_email_at' => 'datetime',
        'sent_whatsapp_at' => 'datetime',
        'generated_at' => 'datetime'
    ];

    public function payrollItem()
    {
        return $this->belongsTo(HrPayrollItem::class, 'payroll_item_id');
    }
}
