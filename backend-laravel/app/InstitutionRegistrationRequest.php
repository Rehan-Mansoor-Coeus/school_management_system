<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class InstitutionRegistrationRequest extends Model
{
    protected $fillable = [
        'institution_name',
        'country',
        'city',
        'contact_person',
        'phone',
        'email',
        'student_population',
        'website',
        'message',
        'status',
        'reviewed_by',
        'reviewed_at',
        'admin_notes',
    ];

    protected $dates = ['reviewed_at'];
}
