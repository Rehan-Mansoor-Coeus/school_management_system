<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\Contract;
use App\Support\SqlDialect;
use Illuminate\Support\Facades\DB;

class ContractDashboardService
{
    public function stats(int $institutionId): array
    {
        $base = Contract::where('institution_id', $institutionId);

        $counts = (clone $base)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $expired = (clone $base)
            ->whereNotNull('end_date')
            ->where('end_date', '<', now()->toDateString())
            ->whereNotIn('status', ['fully_executed', 'rejected'])
            ->count();

        return [
            'total' => (clone $base)->count(),
            'draft' => (int) ($counts['draft'] ?? 0),
            'generated' => (int) ($counts['generated'] ?? 0),
            'sent' => (int) ($counts['sent'] ?? 0),
            'pending_signatures' => (int) (($counts['sent'] ?? 0) + ($counts['generated'] ?? 0)),
            'pending_approval' => (int) ($counts['pending_approval'] ?? 0),
            'approved' => (int) ($counts['approved'] ?? 0),
            'rejected' => (int) ($counts['rejected'] ?? 0),
            'fully_executed' => (int) ($counts['fully_executed'] ?? 0),
            'expired' => $expired,
        ];
    }

    public function charts(int $institutionId): array
    {
        $byType = Contract::where('institution_id', $institutionId)
            ->select('recipient_type', DB::raw('count(*) as total'))
            ->groupBy('recipient_type')
            ->pluck('total', 'recipient_type');

        $byStatus = Contract::where('institution_id', $institutionId)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $byDepartment = Contract::where('institution_id', $institutionId)
            ->get(['merge_data'])
            ->groupBy(function ($contract) {
                $data = is_array($contract->merge_data) ? $contract->merge_data : [];

                return $data['department'] ?? 'Unknown';
            })
            ->map(function ($group) {
                return $group->count();
            });

        $expiringSoon = Contract::where('institution_id', $institutionId)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [now()->toDateString(), now()->addDays(90)->toDateString()])
            ->whereNotIn('status', ['fully_executed', 'rejected'])
            ->orderBy('end_date')
            ->limit(10)
            ->get(['id', 'reference_number', 'recipient_name', 'end_date', 'status']);

        $monthExpr = SqlDialect::yearMonth('created_at');
        $monthly = Contract::where('institution_id', $institutionId)
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('count(*) as total'))
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        return [
            'by_type' => $byType,
            'by_status' => $byStatus,
            'by_department' => $byDepartment,
            'expiring_soon' => $expiringSoon,
            'monthly_activity' => $monthly,
        ];
    }
}
