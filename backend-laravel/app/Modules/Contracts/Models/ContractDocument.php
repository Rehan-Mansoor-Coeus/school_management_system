<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class ContractDocument extends Model
{
    protected $fillable = [
        'institution_id', 'contract_id', 'document_type', 'label',
        'file_path', 'mime_type', 'uploaded_by', 'upload_source',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
