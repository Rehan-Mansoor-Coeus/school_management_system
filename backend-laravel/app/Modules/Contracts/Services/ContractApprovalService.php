<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractApproval;

class ContractApprovalService
{
    protected $contractService;
    protected $pdfService;
    protected $notificationService;

    public function __construct(
        ContractService $contractService,
        ContractPdfService $pdfService,
        ContractNotificationService $notificationService
    ) {
        $this->contractService = $contractService;
        $this->pdfService = $pdfService;
        $this->notificationService = $notificationService;
    }

    public function approve(Contract $contract, int $approverId, ?string $comments = null): Contract
    {
        $approval = $contract->approvals()
            ->where('status', 'pending')
            ->orderBy('step_order')
            ->first();

        if ($approval) {
            $approval->update([
                'approver_id' => $approverId,
                'status' => 'approved',
                'comments' => $comments,
                'acted_at' => now(),
            ]);
        }

        $pending = $contract->approvals()->where('status', 'pending')->count();
        if ($pending === 0) {
            $contract->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
            ]);

            $pdfPath = $this->pdfService->generateExecutedPdf($contract);
            $contract->update([
                'executed_pdf_path' => $pdfPath,
                'executed_at' => now(),
            ]);

            $this->contractService->transitionStatus($contract->fresh(), 'fully_executed', $approverId, 'Contract fully executed');
            $this->notificationService->distributeExecutedCopies($contract->fresh());
        } else {
            $this->contractService->transitionStatus($contract->fresh(), 'pending_approval', $approverId, 'Partial approval recorded');
        }

        return $contract->fresh(['approvals', 'documents']);
    }

    public function reject(Contract $contract, int $approverId, string $reason): Contract
    {
        $approval = $contract->approvals()->where('status', 'pending')->orderBy('step_order')->first();
        if ($approval) {
            $approval->update([
                'approver_id' => $approverId,
                'status' => 'rejected',
                'comments' => $reason,
                'acted_at' => now(),
            ]);
        }

        $contract->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        $this->contractService->transitionStatus($contract->fresh(), 'rejected', $approverId, $reason);

        return $contract->fresh();
    }

    public function configureApprovals(Contract $contract, array $steps): void
    {
        $contract->approvals()->delete();

        foreach ($steps as $index => $step) {
            ContractApproval::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'approver_role' => $step['approver_role'] ?? null,
                'approver_id' => $step['approver_id'] ?? null,
                'step_order' => $index + 1,
                'status' => 'pending',
            ]);
        }
    }
}
