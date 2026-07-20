<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicenseInvoice;
use App\Modules\Licensing\Models\LicensePayment;
use App\Modules\Licensing\Services\InstitutionLicenseService;
use App\Modules\Licensing\Services\LicenseAuditService;
use App\Modules\Licensing\Services\LicenseBillingService;
use App\Modules\Licensing\Services\LicenseNotificationService;
use App\Support\AdminContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InstitutionBillingController extends Controller
{
    public function summary(Request $request)
    {
        $institution = $this->requireInstitution($request);
        $current = app(InstitutionLicenseService::class)->toCurrentLicensePayload(
            $institution,
            app(InstitutionLicenseService::class)->currentFor($institution)
        );

        $semesters = InstitutionSemesterLicense::query()
            ->with(['plan', 'academicYear'])
            ->where('institution_id', $institution->id)
            ->orderByDesc('id')
            ->get()
            ->map->toApiArray()
            ->values();

        $invoices = LicenseInvoice::query()
            ->with('items')
            ->where('institution_id', $institution->id)
            ->orderByDesc('id')
            ->get()
            ->map->toApiArray()
            ->values();

        $payments = LicensePayment::query()
            ->with('proofs')
            ->where('institution_id', $institution->id)
            ->orderByDesc('id')
            ->get()
            ->map->toApiArray()
            ->values();

        return response()->json([
            'current_license' => $current,
            'semester_licenses' => $semesters,
            'invoices' => $invoices,
            'payments' => $payments,
            'notes' => [
                'Projected amounts are estimates until the student count is locked.',
                'Final amounts apply after lock and reconciliation.',
                'Payment proofs must be verified by the platform before activation.',
            ],
        ]);
    }

    public function uploadProof(Request $request)
    {
        $institution = $this->requireInstitution($request);

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|max:10',
            'method' => 'nullable|string|max:40',
            'reference' => 'nullable|string|max:120',
            'notes' => 'nullable|string',
            'license_invoice_id' => 'nullable|integer|exists:license_invoices,id',
            'institution_semester_license_id' => 'nullable|integer|exists:institution_semester_licenses,id',
            'allocation_type' => 'nullable|string|max:40',
            'proof' => 'required|file|max:10240|mimes:jpg,jpeg,png,pdf,webp',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->get('license_invoice_id')) {
            $invoice = LicenseInvoice::findOrFail($request->get('license_invoice_id'));
            if ((int) $invoice->institution_id !== (int) $institution->id) {
                return response()->json(['message' => 'Invoice does not belong to this institution.'], 403);
            }
        }

        if ($request->get('institution_semester_license_id')) {
            $sem = InstitutionSemesterLicense::findOrFail($request->get('institution_semester_license_id'));
            if ((int) $sem->institution_id !== (int) $institution->id) {
                return response()->json(['message' => 'Semester license does not belong to this institution.'], 403);
            }
        }

        $billing = app(LicenseBillingService::class);
        $payment = $billing->recordPayment([
            'institution_id' => $institution->id,
            'amount' => $request->get('amount'),
            'currency' => $request->get('currency', 'XAF'),
            'method' => $request->get('method', 'proof_upload'),
            'reference' => $request->get('reference'),
            'notes' => $request->get('notes'),
            'license_invoice_id' => $request->get('license_invoice_id'),
            'institution_semester_license_id' => $request->get('institution_semester_license_id'),
            'allocation_type' => $request->get('allocation_type', 'down_payment'),
            'auto_verify' => false,
        ], optional($request->user())->id);

        $billing->attachProof($payment, $request->file('proof'), optional($request->user())->id);

        return response()->json([
            'message' => 'Payment proof submitted for verification.',
            'data' => $payment->fresh('proofs')->toApiArray(),
        ], 201);
    }

    /**
     * Institution Admin may request renewal / upgrade / extra modules (not edit prices).
     */
    public function requestChange(Request $request)
    {
        $institution = $this->requireInstitution($request);

        $validator = Validator::make($request->all(), [
            'request_type' => 'required|string|in:renewal,upgrade,add_modules,support',
            'notes' => 'nullable|string|max:2000',
            'module_keys' => 'nullable|array',
            'module_keys.*' => 'string|max:80',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        app(LicenseAuditService::class)->log([
            'institution_id' => $institution->id,
            'entity_type' => 'institution_billing_request',
            'entity_id' => $institution->id,
            'action' => $data['request_type'],
            'reason' => $data['notes'] ?? null,
            'meta' => ['module_keys' => $data['module_keys'] ?? []],
            'acted_by' => optional($request->user())->id,
            'ip_address' => $request->ip(),
        ]);

        $semester = InstitutionSemesterLicense::query()
            ->where('institution_id', $institution->id)
            ->orderByDesc('id')
            ->first();
        if ($semester) {
            app(LicenseNotificationService::class)->notifySemesterEvent($semester, 'renewal_request', [
                'Request' => $data['request_type'],
            ]);
        } else {
            app(LicenseNotificationService::class)->notifyInstitutionLicenseExpiry(
                $institution,
                'renewal_reminder',
                null
            );
        }

        return response()->json([
            'message' => 'Your request was submitted to the platform team.',
            'request_type' => $data['request_type'],
        ], 201);
    }

    protected function requireInstitution(Request $request): Institution
    {
        $id = AdminContext::activeInstitutionId($request, $request->user());
        if (! $id) {
            abort(422, 'Switch into an institution context to view billing.');
        }

        return Institution::findOrFail($id);
    }
}
