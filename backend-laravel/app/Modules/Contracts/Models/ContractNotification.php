<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractNotification extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'channel', 'recipient',
        'status', 'message', 'sent_at', 'error_message',
    ];

    protected $casts = ['sent_at' => 'datetime'];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
