<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseAuditLog extends Model
{
    protected $fillable = [
        'institution_id', 'institution_license_id', 'institution_semester_license_id',
        'license_plan_id', 'entity_type', 'entity_id', 'action', 'field',
        'old_value', 'new_value', 'reason', 'meta', 'acted_by', 'ip_address',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'action' => $this->action,
            'field' => $this->field,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'reason' => $this->reason,
            'meta' => $this->meta,
            'acted_by' => $this->acted_by,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
