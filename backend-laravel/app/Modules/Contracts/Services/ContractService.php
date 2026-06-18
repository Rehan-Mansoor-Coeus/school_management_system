<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractApproval;
use App\Modules\Contracts\Models\ContractSignatory;
use App\Modules\Contracts\Models\ContractStatusLog;
use App\Modules\Contracts\Models\ContractTemplate;
use App\Modules\Contracts\Models\DocumentType;
use App\Student;
use App\User;
use App\Modules\Hr\Models\HrStaffProfile;
use Illuminate\Support\Str;

class ContractService
{
    protected $mergeService;

    public function __construct(ContractMergeService $mergeService)
    {
        $this->mergeService = $mergeService;
    }

    public function list(int $institutionId, array $filters = [])
    {
        $query = Contract::query()
            ->with(['template:id,name', 'documentType:id,name,key', 'user:id,name,email'])
            ->where('institution_id', $institutionId);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['recipient_type'])) {
            $query->where('recipient_type', $filters['recipient_type']);
        }
        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (! empty($filters['document_type_id'])) {
            $query->where('document_type_id', $filters['document_type_id']);
        }
        if (! empty($filters['expired'])) {
            $query->whereNotNull('end_date')
                ->where('end_date', '<', now()->toDateString())
                ->whereNotIn('status', ['rejected']);
        }
        if (! empty($filters['pending_signatures'])) {
            $query->whereIn('status', ['generated', 'sent']);
        }
        if (! empty($filters['pending_approval'])) {
            $query->where('status', 'pending_approval');
        }
        if (! empty($filters['completed'])) {
            $query->where('status', 'fully_executed');
        }
        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('recipient_name', 'like', $search)
                    ->orWhere('reference_number', 'like', $search)
                    ->orWhere('recipient_email', 'like', $search);
            });
        }

        return $query->orderByDesc('id')->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function show(int $institutionId, int $id): ?Contract
    {
        return Contract::with(['template', 'documentType', 'signatories', 'approvals', 'documents', 'statusLogs'])
            ->where('institution_id', $institutionId)
            ->find($id);
    }

    public function generateSingle(int $institutionId, int $userId, array $data): Contract
    {
        $documentType = null;
        if (! empty($data['document_type_id'])) {
            $documentType = DocumentType::where('institution_id', $institutionId)->find($data['document_type_id']);
        }

        $templateId = $data['template_id'] ?? ($documentType ? $documentType->default_template_id : null);
        if (! $templateId) {
            throw new \InvalidArgumentException('A template or document type with a default template is required.');
        }
        $template = ContractTemplate::where('institution_id', $institutionId)->findOrFail($templateId);

        if (! $documentType && $template->document_type_id) {
            $documentType = DocumentType::where('institution_id', $institutionId)->find($template->document_type_id);
        }

        $recipientType = $documentType ? $documentType->recipient_type : $template->recipient_type;
        $recipient = $this->resolveRecipient($institutionId, $data);

        $mergeData = $this->mergeService->buildForUser(
            $institutionId,
            $recipientType,
            $recipient['user_id'] ?? null,
            $recipient['student_id'] ?? null,
            $recipient['hr_staff_profile_id'] ?? null,
            array_merge($data['merge_overrides'] ?? [], $data['metadata'] ?? [])
        );

        $bodyHtml = $this->mergeService->render($template->body_html, $mergeData);

        $supportsExpiry = $documentType ? (bool) $documentType->supports_expiry : true;

        $contract = Contract::create([
            'institution_id' => $institutionId,
            'template_id' => $template->id,
            'document_type_id' => $documentType ? $documentType->id : $template->document_type_id,
            'reference_number' => $this->nextReference($institutionId),
            'verification_code' => strtoupper(Str::random(10)),
            'title' => $data['title'] ?? ($documentType ? $documentType->name : $template->name),
            'category' => $documentType ? $documentType->category : $template->category,
            'recipient_type' => $recipientType,
            'status' => 'generated',
            'user_id' => $recipient['user_id'] ?? null,
            'student_id' => $recipient['student_id'] ?? null,
            'hr_staff_profile_id' => $recipient['hr_staff_profile_id'] ?? null,
            'recipient_name' => $recipient['name'],
            'recipient_email' => $recipient['email'] ?? null,
            'recipient_phone' => $recipient['phone'] ?? null,
            'body_html' => $bodyHtml,
            'merge_data' => $mergeData,
            'metadata' => $data['metadata'] ?? [],
            'start_date' => $data['start_date'] ?? ($mergeData['contract_start_date'] ?? null),
            'end_date' => $supportsExpiry ? ($data['end_date'] ?? ($mergeData['contract_end_date'] ?? null)) : null,
            'created_by' => $userId,
        ]);

        $this->seedSignatories($contract, $documentType, $recipient, $data['signatories'] ?? []);

        $this->logStatus($contract, null, 'generated', $userId, 'Document generated');

        return $contract->fresh(['template', 'documentType', 'signatories']);
    }

    protected function seedSignatories(Contract $contract, ?DocumentType $documentType, array $recipient, array $overrides = []): void
    {
        $config = $documentType && is_array($documentType->required_signatories) && count($documentType->required_signatories)
            ? $documentType->required_signatories
            : [['role' => 'recipient', 'label' => 'Recipient', 'required' => true]];

        $overrideByRole = [];
        foreach ($overrides as $ov) {
            if (! empty($ov['role'])) {
                $overrideByRole[$ov['role']] = $ov;
            }
        }

        foreach (array_values($config) as $index => $signer) {
            $role = $signer['role'] ?? ('signer_'.($index + 1));
            $isPrimary = $index === 0;
            $ov = $overrideByRole[$role] ?? [];

            ContractSignatory::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'role' => $role,
                'label' => $signer['label'] ?? ucfirst(str_replace('_', ' ', $role)),
                'sort_order' => $index,
                'is_required' => $signer['required'] ?? true,
                'name' => $ov['name'] ?? ($isPrimary ? $recipient['name'] : ($signer['label'] ?? $role)),
                'email' => $ov['email'] ?? ($isPrimary ? ($recipient['email'] ?? null) : null),
                'phone' => $ov['phone'] ?? ($isPrimary ? ($recipient['phone'] ?? null) : null),
            ]);
        }
    }

    public function generateBulk(int $institutionId, int $userId, array $data): array
    {
        $recipients = $data['recipients'] ?? [];
        $created = [];

        foreach ($recipients as $recipientPayload) {
            $created[] = $this->generateSingle($institutionId, $userId, array_merge($data, $recipientPayload));
        }

        return $created;
    }

    public function transitionStatus(Contract $contract, string $toStatus, ?int $actorId = null, ?string $notes = null, ?string $ip = null): Contract
    {
        $from = $contract->status;
        $contract->status = $toStatus;
        $contract->save();

        $this->logStatus($contract, $from, $toStatus, $actorId, $notes, $ip);

        return $contract->fresh();
    }

    public function renew(int $institutionId, int $userId, Contract $original, array $data): Contract
    {
        $newContract = $this->generateSingle($institutionId, $userId, [
            'template_id' => $original->template_id,
            'document_type_id' => $original->document_type_id,
            'title' => ($original->title ?? 'Document').' (Renewal)',
            'user_id' => $original->user_id,
            'student_id' => $original->student_id,
            'hr_staff_profile_id' => $original->hr_staff_profile_id,
            'start_date' => $data['start_date'] ?? now()->toDateString(),
            'end_date' => $data['end_date'] ?? null,
        ]);

        \App\Modules\Contracts\Models\ContractRenewal::create([
            'institution_id' => $institutionId,
            'original_contract_id' => $original->id,
            'renewed_contract_id' => $newContract->id,
            'previous_end_date' => $original->end_date,
            'new_end_date' => $newContract->end_date,
            'renewed_by' => $userId,
        ]);

        return $newContract;
    }

    protected function resolveRecipient(int $institutionId, array $data): array
    {
        if (! empty($data['student_id'])) {
            $student = Student::with('user')->where('institution_id', $institutionId)->findOrFail($data['student_id']);

            return [
                'student_id' => $student->id,
                'user_id' => $student->user_id,
                'name' => optional($student->user)->name ?: 'Student',
                'email' => optional($student->user)->email,
                'phone' => optional($student->user)->phone_number,
            ];
        }

        if (! empty($data['hr_staff_profile_id'])) {
            $staff = HrStaffProfile::where('institution_id', $institutionId)->findOrFail($data['hr_staff_profile_id']);

            return [
                'hr_staff_profile_id' => $staff->id,
                'user_id' => $staff->user_id,
                'name' => trim($staff->first_name.' '.$staff->last_name),
                'email' => $staff->email,
                'phone' => $staff->phone,
            ];
        }

        if (! empty($data['user_id'])) {
            $user = User::where('institution_id', $institutionId)->findOrFail($data['user_id']);

            return [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number,
            ];
        }

        return [
            'name' => $data['recipient_name'] ?? 'Recipient',
            'email' => $data['recipient_email'] ?? null,
            'phone' => $data['recipient_phone'] ?? null,
        ];
    }

    protected function nextReference(int $institutionId): string
    {
        $prefix = 'CTR-'.date('Y').'-';
        $last = Contract::where('institution_id', $institutionId)
            ->where('reference_number', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('reference_number');

        $seq = 1;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        return $prefix.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }

    protected function logStatus(Contract $contract, ?string $from, string $to, ?int $actorId, ?string $notes = null, ?string $ip = null): void
    {
        ContractStatusLog::create([
            'institution_id' => $contract->institution_id,
            'contract_id' => $contract->id,
            'from_status' => $from,
            'to_status' => $to,
            'actor_id' => $actorId,
            'actor_type' => $actorId ? 'user' : 'system',
            'notes' => $notes,
            'ip_address' => $ip,
        ]);
    }
}
