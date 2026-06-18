<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrLetter extends Model
{
    protected $table = 'hr_letters';

    protected $fillable = [
        'institution_id','template_id','staff_profile_id','letter_type','subject','body','reference_code','status','sent_whatsapp_at','sent_email_at','created_by'
    ];
    protected $casts = [
        'sent_whatsapp_at' => 'datetime',
        'sent_email_at' => 'datetime'
    ];
}
