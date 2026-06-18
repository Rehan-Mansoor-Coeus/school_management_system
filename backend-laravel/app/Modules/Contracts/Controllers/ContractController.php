<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Concerns\ResolvesInstitution;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Services\ContractApprovalService;
use App\Modules\Contracts\Services\ContractNotificationService;
use App\Modules\Contracts\Services\ContractService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContractController extends Controller
{
    use ResolvesInstitution;

    protected $service;
    protected $notificationService;
    protected $approvalService;

    public function __construct(
        ContractService $service,
        ContractNotificationService $notificationService,
        ContractApprovalService $approvalService
    ) {
        $this->service = $service;
        $this->notificationService = $notificationService;
        $this->approvalService = $approvalService;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->all());

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show($id)
    {
        $contract = $this->service->show($this->institutionId(), (int) $id);
        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $contract]);
    }

    public function generate(Request $request)
    {
        $data = $request->validate([
            'document_type_id' => 'nullable|integer',
            'template_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'user_id' => 'nullable|integer',
            'student_id' => 'nullable|integer',
            'hr_staff_profile_id' => 'nullable|integer',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_email' => 'nullable|email',
            'recipient_phone' => 'nullable|string|max:40',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'merge_overrides' => 'nullable|array',
            'metadata' => 'nullable|array',
            'signatories' => 'nullable|array',
            'signatories.*.role' => 'nullable|string|max:60',
            'signatories.*.name' => 'nullable|string|max:255',
            'signatories.*.email' => 'nullable|email',
            'signatories.*.phone' => 'nullable|string|max:40',
        ]);

        if (empty($data['document_type_id']) && empty($data['template_id'])) {
            return response()->json(['success' => false, 'message' => 'A document type or template is required.'], 422);
        }

        $contract = $this->service->generateSingle($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $contract], 201);
    }

    public function generateBulk(Request $request)
    {
        $data = $request->validate([
            'document_type_id' => 'nullable|integer',
            'template_id' => 'nullable|integer',
            'recipients' => 'required|array|min:1',
            'recipients.*.user_id' => 'nullable|integer',
            'recipients.*.student_id' => 'nullable|integer',
            'recipients.*.hr_staff_profile_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $contracts = $this->service->generateBulk($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $contracts], 201);
    }

    public function send(Request $request, $id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate([
            'channels' => 'nullable|array',
            'channels.*' => 'string|in:email,whatsapp,internal',
            'expires_days' => 'nullable|integer|min:1|max:90',
        ]);

        $result = $this->notificationService->sendSigningLink(
            $contract,
            $data['channels'] ?? ['email'],
            $data['expires_days'] ?? 14
        );

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function approve(Request $request, $id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate(['comments' => 'nullable|string']);
        $updated = $this->approvalService->approve($contract, (int) auth()->id(), $data['comments'] ?? null);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function reject(Request $request, $id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate(['reason' => 'required|string|max:1000']);
        $updated = $this->approvalService->reject($contract, (int) auth()->id(), $data['reason']);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function renew(Request $request, $id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $renewed = $this->service->renew($this->institutionId(), (int) auth()->id(), $contract, $data);

        return response()->json(['success' => true, 'data' => $renewed], 201);
    }

    public function destroy($id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        $contract->delete();

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    public function download($id)
    {
        $contract = Contract::where('institution_id', $this->institutionId())->findOrFail($id);
        if (! $contract->executed_pdf_path || ! Storage::disk('public')->exists($contract->executed_pdf_path)) {
            return response()->json(['success' => false, 'message' => 'Executed PDF not available'], 404);
        }

        return Storage::disk('public')->download(
            $contract->executed_pdf_path,
            $contract->reference_number.'.pdf'
        );
    }
}
