<?php

namespace App\Modules\Audit\Services;

use App\AuditLog;
use App\TimesheetAuditLog;
use App\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AuditActivityService
{
    public function list(int $institutionId, array $filters = []): array
    {
        $limit = min(100, max(10, (int) ($filters['per_page'] ?? 50)));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $search = trim((string) ($filters['search'] ?? ''));
        $source = trim((string) ($filters['source'] ?? ''));
        $action = trim((string) ($filters['action'] ?? ''));

        $rows = collect();

        if ($source === '' || $source === 'system') {
            $rows = $rows->merge($this->systemLogs($institutionId, $search, $action));
        }

        if ($source === '' || $source === 'timesheet') {
            $rows = $rows->merge($this->timesheetLogs($institutionId, $search, $action));
        }

        if ($source === '' || $source === 'messaging') {
            $rows = $rows->merge($this->messageLogs($institutionId, $search, $action));
        }

        if ($source === '' || $source === 'auth') {
            $rows = $rows->merge($this->otpLogs($institutionId, $search, $action));
        }

        $sorted = $rows->sortByDesc(function ($row) {
            return $row['created_at'];
        })->values();

        $total = $sorted->count();
        $items = $sorted->slice(($page - 1) * $limit, $limit)->values();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'last_page' => (int) max(1, ceil($total / $limit)),
            ],
        ];
    }

    protected function systemLogs(int $institutionId, string $search, string $action): Collection
    {
        $query = AuditLog::query()
            ->where('institution_id', $institutionId)
            ->with('user:id,name,email')
            ->latest();

        if ($action !== '') {
            $query->where('action', 'like', '%'.$action.'%');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', '%'.$search.'%')
                    ->orWhere('model_type', 'like', '%'.$search.'%');
            });
        }

        return $query->limit(200)->get()->map(function (AuditLog $log) {
            return [
                'id' => 'system-'.$log->id,
                'source' => 'system',
                'action' => $log->action,
                'summary' => $this->summarize($log->action, $log->model_type, $log->model_id),
                'user_id' => $log->user_id,
                'user_name' => $log->user ? $log->user->name : 'System',
                'user_email' => $log->user ? $log->user->email : null,
                'model_type' => $log->model_type,
                'model_id' => $log->model_id,
                'ip_address' => $log->ip_address,
                'metadata' => [
                    'old' => $log->old_values,
                    'new' => $log->new_values,
                ],
                'created_at' => $log->created_at ? (string) $log->created_at : null,
            ];
        });
    }

    protected function timesheetLogs(int $institutionId, string $search, string $action): Collection
    {
        if (! class_exists(TimesheetAuditLog::class)) {
            return collect();
        }

        $query = TimesheetAuditLog::query()
            ->where('institution_id', $institutionId)
            ->latest();

        if ($action !== '') {
            $query->where('event', 'like', '%'.$action.'%');
        }

        if ($search !== '') {
            $query->where('event', 'like', '%'.$search.'%');
        }

        $actorIds = $query->limit(200)->pluck('actor_id')->filter()->unique()->values();
        $actors = User::whereIn('id', $actorIds)->get(['id', 'name', 'email'])->keyBy('id');

        return TimesheetAuditLog::query()
            ->where('institution_id', $institutionId)
            ->when($action !== '', function ($q) use ($action) {
                $q->where('event', 'like', '%'.$action.'%');
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where('event', 'like', '%'.$search.'%');
            })
            ->latest()
            ->limit(200)
            ->get()
            ->map(function ($log) use ($actors) {
                $actor = $log->actor_id ? $actors->get($log->actor_id) : null;

                return [
                    'id' => 'timesheet-'.$log->id,
                    'source' => 'timesheet',
                    'action' => $log->event,
                    'summary' => 'Timesheet: '.str_replace('_', ' ', $log->event),
                    'user_id' => $log->actor_id,
                    'user_name' => $actor ? $actor->name : 'System',
                    'user_email' => $actor ? $actor->email : null,
                    'model_type' => $log->entity_type ?: 'timesheet',
                    'model_id' => $log->entity_id ?: $log->entry_id,
                    'ip_address' => null,
                    'metadata' => $log->metadata,
                    'created_at' => $log->created_at ? (string) $log->created_at : null,
                ];
            });
    }

    protected function messageLogs(int $institutionId, string $search, string $action): Collection
    {
        if (! DB::getSchemaBuilder()->hasTable('message_logs')) {
            return collect();
        }

        $query = DB::table('message_logs')
            ->where('institution_id', $institutionId)
            ->orderByDesc('created_at');

        if ($action !== '') {
            $query->where('status', 'like', '%'.$action.'%');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('recipient_name', 'like', '%'.$search.'%')
                    ->orWhere('phone_number', 'like', '%'.$search.'%')
                    ->orWhere('module', 'like', '%'.$search.'%');
            });
        }

        return collect($query->limit(200)->get())->map(function ($log) {
            return [
                'id' => 'message-'.$log->id,
                'source' => 'messaging',
                'action' => 'message.'.$log->status,
                'summary' => ucfirst($log->message_type).' to '.($log->recipient_name ?: $log->phone_number).' ('.$log->module.')',
                'user_id' => null,
                'user_name' => $log->recipient_name ?: 'Recipient',
                'user_email' => null,
                'model_type' => $log->module ?: 'message',
                'model_id' => $log->related_id,
                'ip_address' => null,
                'metadata' => [
                    'status' => $log->status,
                    'phone' => $log->phone_number,
                    'error' => $log->error_message,
                ],
                'created_at' => $log->created_at ? (string) $log->created_at : null,
            ];
        });
    }

    protected function otpLogs(int $institutionId, string $search, string $action): Collection
    {
        if (! DB::getSchemaBuilder()->hasTable('otp_logs')) {
            return collect();
        }

        $query = DB::table('otp_logs')
            ->where('institution_id', $institutionId)
            ->orderByDesc('created_at');

        if ($action !== '') {
            $query->where('action', 'like', '%'.$action.'%');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('module', 'like', '%'.$search.'%')
                    ->orWhere('action', 'like', '%'.$search.'%');
            });
        }

        $rows = collect($query->limit(100)->get());
        $userIds = $rows->pluck('user_id')->filter()->unique();
        $users = User::whereIn('id', $userIds)->get(['id', 'name', 'email'])->keyBy('id');

        return $rows->map(function ($log) use ($users) {
            $user = $log->user_id ? $users->get($log->user_id) : null;

            return [
                'id' => 'otp-'.$log->id,
                'source' => 'auth',
                'action' => $log->action,
                'summary' => 'OTP '.$log->action.' ('.$log->module.')',
                'user_id' => $log->user_id,
                'user_name' => $user ? $user->name : 'User',
                'user_email' => $user ? $user->email : null,
                'model_type' => $log->module,
                'model_id' => $log->related_id,
                'ip_address' => null,
                'metadata' => ['status' => $log->status, 'phone' => $log->phone_number],
                'created_at' => $log->created_at ? (string) $log->created_at : null,
            ];
        });
    }

    protected function summarize(string $action, string $modelType, $modelId): string
    {
        $label = str_replace('_', ' ', $action);
        $entity = class_basename($modelType);

        return ucfirst($label).' — '.$entity.($modelId ? ' #'.$modelId : '');
    }
}
