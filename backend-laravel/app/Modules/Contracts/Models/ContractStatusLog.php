<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractStatusLog extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'from_status', 'to_status',
        'actor_id', 'actor_type', 'notes', 'ip_address',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
