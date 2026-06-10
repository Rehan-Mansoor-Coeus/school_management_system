<?php

namespace App\Modules\Admissions\Models;

use App\AdmissionAgreement;
use Illuminate\Database\Eloquent\Model;

class ApplicationAgreementAcceptance extends Model
{
    protected $table = 'application_agreement_acceptances';

    protected $fillable = [
        'application_id',
        'admission_agreement_id',
        'accepted_at',
    ];

    protected $dates = ['accepted_at'];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function agreement()
    {
        return $this->belongsTo(AdmissionAgreement::class, 'admission_agreement_id');
    }
}
