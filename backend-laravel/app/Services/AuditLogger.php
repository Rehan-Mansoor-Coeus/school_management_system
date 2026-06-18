<?php

namespace App\Services;

use App\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(
        int $institutionId,
        string $action,
        string $modelType,
        $modelId = null,
        ?int $userId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ): AuditLog {
        $request = $request ?: request();

        return AuditLog::create([
            'institution_id' => $institutionId,
            'user_id' => $userId ?: optional(auth()->user())->id,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? (string) $request->userAgent() : null,
        ]);
    }
}
