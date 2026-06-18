<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractAccessToken extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'signatory_id', 'token_hash', 'expires_at',
        'single_use', 'used_at', 'opened_at', 'last_ip', 'last_user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'opened_at' => 'datetime',
        'single_use' => 'boolean',
    ];

    public function signatory()
    {
        return $this->belongsTo(ContractSignatory::class, 'signatory_id');
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
