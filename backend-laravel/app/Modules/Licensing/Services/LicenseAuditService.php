<?php

namespace App\Modules\Licensing\Services;

use App\Modules\Licensing\Models\LicenseAuditLog;
use Illuminate\Support\Facades\Schema;

class LicenseAuditService
{
    public function log(array $data): ?LicenseAuditLog
    {
        if (! Schema::hasTable('license_audit_logs')) {
            return null;
        }

        return LicenseAuditLog::create([
            'institution_id' => $data['institution_id'] ?? null,
            'institution_license_id' => $data['institution_license_id'] ?? null,
            'institution_semester_license_id' => $data['institution_semester_license_id'] ?? null,
            'license_plan_id' => $data['license_plan_id'] ?? null,
            'entity_type' => $data['entity_type'] ?? 'unknown',
            'entity_id' => $data['entity_id'] ?? null,
            'action' => $data['action'] ?? 'update',
            'field' => $data['field'] ?? null,
            'old_value' => isset($data['old_value']) ? (is_scalar($data['old_value']) ? (string) $data['old_value'] : json_encode($data['old_value'])) : null,
            'new_value' => isset($data['new_value']) ? (is_scalar($data['new_value']) ? (string) $data['new_value'] : json_encode($data['new_value'])) : null,
            'reason' => $data['reason'] ?? null,
            'meta' => $data['meta'] ?? null,
            'acted_by' => $data['acted_by'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
        ]);
    }

    public function list(array $filters = [])
    {
        if (! Schema::hasTable('license_audit_logs')) {
            return collect();
        }

        $query = LicenseAuditLog::query()->orderByDesc('id');
        if (! empty($filters['institution_id'])) {
            $query->where('institution_id', $filters['institution_id']);
        }
        if (! empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        return $query->limit((int) ($filters['limit'] ?? 100))->get();
    }
}
