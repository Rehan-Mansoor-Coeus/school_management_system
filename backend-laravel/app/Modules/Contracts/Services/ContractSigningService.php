<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractAccessToken;
use App\Modules\Contracts\Models\ContractApproval;
use App\Modules\Contracts\Models\ContractDocument;
use App\Modules\Contracts\Models\ContractSignatory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContractSigningService
{
    protected $contractService;
    protected $pdfService;

    public function __construct(
        ContractService $contractService,
        ContractPdfService $pdfService
    ) {
        $this->contractService = $contractService;
        $this->pdfService = $pdfService;
    }

    public function createAccessToken(Contract $contract, ?int $expiresDays = 14, bool $singleUse = false, ?int $signatoryId = null): array
    {
        $plain = Str::random(64);
        ContractAccessToken::create([
            'institution_id' => $contract->institution_id,
            'contract_id' => $contract->id,
            'signatory_id' => $signatoryId,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDays($expiresDays),
            'single_use' => $singleUse,
        ]);

        $url = rtrim(env('FRONTEND_URL', config('app.url')), '/').'/contract-sign/'.$plain;

        return ['token' => $plain, 'url' => $url];
    }

    public function resolveToken(string $plainToken): ?ContractAccessToken
    {
        $hash = hash('sha256', $plainToken);
        $record = ContractAccessToken::with(['contract.template', 'contract.documentType', 'contract.signatories', 'signatory'])
            ->where('token_hash', $hash)
            ->first();

        if (! $record) {
            return null;
        }
        if ($record->expires_at && $record->expires_at->isPast()) {
            return null;
        }
        if ($record->single_use && $record->used_at) {
            return null;
        }

        return $record;
    }

    public function publicPayload(ContractAccessToken $tokenRecord): array
    {
        $contract = $tokenRecord->contract;
        $template = $contract->template;
        $signatory = $this->resolveSignatory($tokenRecord);

        if ($signatory && ! $signatory->opened_at) {
            $signatory->update(['opened_at' => now()]);
        }
        if (! $tokenRecord->opened_at) {
            $tokenRecord->update(['opened_at' => now()]);
        }

        return [
            'contract' => [
                'id' => $contract->id,
                'reference_number' => $contract->reference_number,
                'title' => $contract->title,
                'status' => $contract->status,
                'body_html' => $contract->body_html,
                'recipient_name' => $contract->recipient_name,
                'start_date' => optional($contract->start_date)->toDateString(),
                'end_date' => optional($contract->end_date)->toDateString(),
                'signer_data' => $contract->signer_data ?? [],
                'signed_at' => optional($contract->signed_at)->toIso8601String(),
            ],
            'signatory' => $signatory ? [
                'id' => $signatory->id,
                'role' => $signatory->role,
                'label' => $signatory->label,
                'name' => $signatory->name,
                'signed_at' => optional($signatory->signed_at)->toIso8601String(),
            ] : null,
            'signer_fields' => $template ? ($template->signer_fields ?? []) : [],
            'required_documents' => $this->resolveRequiredUploads($contract),
            'institution_name' => optional($contract->merge_data)['institution_name'] ?? null,
        ];
    }

    public function submitSignature(string $plainToken, array $data, ?string $ip = null, ?string $userAgent = null): array
    {
        $tokenRecord = $this->resolveToken($plainToken);
        if (! $tokenRecord) {
            return ['success' => false, 'message' => 'Invalid or expired signing link'];
        }

        $contract = $tokenRecord->contract;
        if (in_array($contract->status, ['fully_executed', 'rejected'], true)) {
            return ['success' => false, 'message' => 'This document is no longer available for signing'];
        }

        $signaturePath = $this->storeSignatureImage($contract, $data['signature_data'] ?? '');
        $signatory = $this->resolveSignatory($tokenRecord);

        $signerData = array_merge($contract->signer_data ?? [], $data['signer_fields'] ?? []);
        $contract->update(['signer_data' => $signerData]);

        if ($signatory) {
            $signatory->update([
                'signature_path' => $signaturePath,
                'signed_at' => now(),
                'signed_ip' => $ip,
                'signed_user_agent' => $userAgent,
            ]);
        }

        // Store last signature reference on the contract for quick access/PDF.
        $contract->update([
            'signature_path' => $signaturePath ?: $contract->signature_path,
            'signed_at' => $contract->signed_at ?: now(),
            'signed_ip' => $ip,
            'signed_user_agent' => $userAgent,
        ]);

        $allSigned = $this->allRequiredSigned($contract->fresh('signatories'));

        if ($allSigned) {
            $this->contractService->transitionStatus($contract->fresh(), 'signed', null, 'All required signatories signed', $ip);
            $this->contractService->transitionStatus($contract->fresh(), 'pending_approval', null, 'Awaiting approval', $ip);
            $this->seedApprovals($contract->fresh());
        } else {
            $this->contractService->transitionStatus($contract->fresh(), 'sent', null, 'Signatory '.optional($signatory)->role.' signed; awaiting remaining signatories', $ip);
        }

        if ($tokenRecord->single_use) {
            $tokenRecord->update(['used_at' => now(), 'last_ip' => $ip, 'last_user_agent' => $userAgent]);
        } else {
            $tokenRecord->update(['last_ip' => $ip, 'last_user_agent' => $userAgent]);
        }

        return ['success' => true, 'data' => $contract->fresh('signatories'), 'all_signed' => $allSigned];
    }

    protected function resolveSignatory(ContractAccessToken $tokenRecord): ?ContractSignatory
    {
        if ($tokenRecord->signatory_id) {
            return $tokenRecord->signatory ?: ContractSignatory::find($tokenRecord->signatory_id);
        }

        return ContractSignatory::where('contract_id', $tokenRecord->contract_id)
            ->orderBy('sort_order')
            ->first();
    }

    protected function allRequiredSigned(Contract $contract): bool
    {
        $required = $contract->signatories->where('is_required', true);
        if ($required->isEmpty()) {
            return $contract->signatories->whereNotNull('signed_at')->isNotEmpty();
        }

        return $required->whereNull('signed_at')->isEmpty();
    }

    protected function resolveRequiredUploads(Contract $contract): array
    {
        if ($contract->documentType && is_array($contract->documentType->required_uploads) && count($contract->documentType->required_uploads)) {
            return $contract->documentType->required_uploads;
        }

        return $contract->template ? ($contract->template->required_documents ?? []) : [];
    }

    public function uploadDocument(string $plainToken, UploadedFile $file, string $documentType, ?string $label = null): array
    {
        $tokenRecord = $this->resolveToken($plainToken);
        if (! $tokenRecord) {
            return ['success' => false, 'message' => 'Invalid or expired signing link'];
        }

        $allowed = ['pdf', 'jpg', 'jpeg', 'png'];
        $ext = strtolower($file->getClientOriginalExtension());
        if (! in_array($ext, $allowed, true)) {
            return ['success' => false, 'message' => 'Unsupported file type'];
        }

        $contract = $tokenRecord->contract;
        $path = $file->store('contracts/documents/'.$contract->institution_id.'/'.$contract->id, 'public');

        $doc = ContractDocument::create([
            'institution_id' => $contract->institution_id,
            'contract_id' => $contract->id,
            'document_type' => $documentType,
            'label' => $label ?: $documentType,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'upload_source' => 'signer',
        ]);

        return ['success' => true, 'data' => $doc];
    }

    protected function storeSignatureImage(Contract $contract, string $dataUrl): ?string
    {
        if (! $dataUrl || ! Str::startsWith($dataUrl, 'data:image')) {
            return null;
        }

        $parts = explode(',', $dataUrl, 2);
        $binary = base64_decode($parts[1] ?? '');
        if (! $binary) {
            return null;
        }

        $path = 'contracts/signatures/'.$contract->institution_id.'/'.$contract->id.'_'.time().'.png';
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    protected function seedApprovals(Contract $contract): void
    {
        if ($contract->approvals()->count() > 0) {
            return;
        }

        $approvers = $contract->documentType && is_array($contract->documentType->required_approvers)
            ? $contract->documentType->required_approvers
            : [];

        if (empty($approvers)) {
            $approvers = [['role' => 'hr-officer', 'label' => 'HR Officer']];
        }

        foreach (array_values($approvers) as $index => $approver) {
            ContractApproval::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'approver_role' => $approver['role'] ?? null,
                'step_order' => $index + 1,
                'status' => 'pending',
            ]);
        }
    }
}
