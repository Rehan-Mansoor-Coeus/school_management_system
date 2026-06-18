<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractRenewal extends Model
{
    protected $fillable = [
        'institution_id', 'original_contract_id', 'renewed_contract_id',
        'previous_end_date', 'new_end_date', 'renewed_by',
    ];

    protected $casts = [
        'previous_end_date' => 'date',
        'new_end_date' => 'date',
    ];
}
