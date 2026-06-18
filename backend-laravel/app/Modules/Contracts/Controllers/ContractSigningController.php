<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Services\ContractSigningService;
use Illuminate\Http\Request;

class ContractSigningController extends Controller
{
    protected $service;

    public function __construct(ContractSigningService $service)
    {
        $this->service = $service;
    }

    public function verify($code)
    {
        $contract = Contract::where('verification_code', $code)->first();
        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Document not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'reference_number' => $contract->reference_number,
                'title' => $contract->title,
                'status' => $contract->status,
                'recipient_name' => $contract->recipient_name,
                'executed_at' => optional($contract->executed_at)->toIso8601String(),
                'is_executed' => $contract->status === 'fully_executed',
            ],
        ]);
    }

    public function show($token)
    {
        $record = $this->service->resolveToken((string) $token);
        if (! $record) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired signing link'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->publicPayload($record),
        ]);
    }

    public function sign(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'signature_data' => 'required|string',
            'signer_fields' => 'nullable|array',
            'agreed' => 'required|boolean|accepted',
        ]);

        $result = $this->service->submitSignature(
            $data['token'],
            $data,
            $request->ip(),
            $request->userAgent()
        );

        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => (bool) $result['success'],
            'data' => $result['data'] ?? null,
            'message' => $result['message'] ?? null,
        ], $status);
    }

    public function uploadDocument(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'document_type' => 'required|string|max:80',
            'label' => 'nullable|string|max:255',
            'file' => 'required|file|max:10240',
        ]);

        $result = $this->service->uploadDocument(
            $data['token'],
            $request->file('file'),
            $data['document_type'],
            $data['label'] ?? null
        );

        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => (bool) $result['success'],
            'data' => $result['data'] ?? null,
            'message' => $result['message'] ?? null,
        ], $status);
    }
}
