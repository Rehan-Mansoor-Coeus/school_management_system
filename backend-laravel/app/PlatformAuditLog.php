<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PlatformAuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'institution_id',
        'meta',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public static function record($userId, string $action, $institutionId = null, array $meta = [], Request $request = null)
    {
        try {
            return static::create([
                'user_id' => $userId,
                'action' => $action,
                'institution_id' => $institutionId,
                'meta' => $meta,
                'ip_address' => $request ? $request->ip() : null,
                'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : null,
            ]);
        } catch (\Throwable $e) {
            // Never break primary flow if audit table is missing during deploy.
            \Illuminate\Support\Facades\Log::warning('Platform audit log failed: '.$e->getMessage());

            return null;
        }
    }
}
