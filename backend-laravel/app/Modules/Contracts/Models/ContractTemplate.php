<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'document_type_id', 'name', 'code', 'category', 'recipient_type', 'description',
        'body_html', 'merge_fields', 'required_documents', 'signer_fields',
        'is_active', 'is_archived', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'merge_fields' => 'array',
        'required_documents' => 'array',
        'signer_fields' => 'array',
        'is_active' => 'boolean',
        'is_archived' => 'boolean',
    ];

    public function contracts()
    {
        return $this->hasMany(Contract::class, 'template_id');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }
}
