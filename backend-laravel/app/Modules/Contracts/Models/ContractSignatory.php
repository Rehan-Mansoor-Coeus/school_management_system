<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractSignatory extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'role', 'label', 'sort_order', 'is_required',
        'name', 'email', 'phone', 'signature_path', 'signed_at', 'signed_ip', 'signed_user_agent', 'opened_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'opened_at' => 'datetime',
        'is_required' => 'boolean',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
