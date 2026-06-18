<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractApproval extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'approver_id', 'approver_role',
        'step_order', 'status', 'comments', 'acted_at',
    ];

    protected $casts = ['acted_at' => 'datetime'];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
