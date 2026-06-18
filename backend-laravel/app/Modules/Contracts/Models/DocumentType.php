<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'key', 'name', 'description', 'category', 'recipient_type',
        'default_template_id', 'required_signatories', 'required_approvers', 'required_uploads',
        'field_schema', 'expiry_rules', 'notification_rules', 'supports_expiry', 'is_system',
        'is_active', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'required_signatories' => 'array',
        'required_approvers' => 'array',
        'required_uploads' => 'array',
        'field_schema' => 'array',
        'expiry_rules' => 'array',
        'notification_rules' => 'array',
        'supports_expiry' => 'boolean',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function defaultTemplate()
    {
        return $this->belongsTo(ContractTemplate::class, 'default_template_id');
    }

    public function templates()
    {
        return $this->hasMany(ContractTemplate::class, 'document_type_id');
    }
}
