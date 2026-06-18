<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;

class HrJob extends Model
{
    protected $table = 'hr_jobs';

    protected $fillable = [
        'institution_id','name','client_name','location','description','start_date','end_date','status','created_by'
    ];
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date'
    ];
}
