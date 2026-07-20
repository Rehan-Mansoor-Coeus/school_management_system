<?php

namespace App\Http\Controllers\Api\SuperAdmin\Licensing;

use App\Http\Controllers\Controller;
use App\Modules\Licensing\Models\LicenseDiscount;
use App\Modules\Licensing\Models\LicenseInvoice;
use App\Modules\Licensing\Models\LicensePayment;
use App\Modules\Licensing\Services\LicenseAuditService;
use App\Modules\Licensing\Services\LicenseBillingService;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class LicenseBillingController extends Controller
{
    protected $billing;

    public function __construct(LicenseBillingService $billing)
    {
        $this->billing = $billing;
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage license billing.');
            }

            return $next($request);
        });
    }

    public function overview()
    {
        return response()->json(['data' => $this->billing->overviewKpis()]);
    }

    public function invoices(Request $request)
    {
        $rows = $this->billing->listInvoices([
            'institution_id' => $request->get('institution_id'),
            'status' => $request->get('status'),
        ]);

        return response()->json([
            'data' => $rows->map->toApiArray()->values(),
        ]);
    }

    public function showInvoice($id)
    {
        $invoice = LicenseInvoice::with(['items', 'institution', 'semesterLicense'])->findOrFail($id);

        return response()->json(['data' => $invoice->toApiArray()]);
    }

    public function payments(Request $request)
    {
        $rows = $this->billing->listPayments([
            'institution_id' => $request->get('institution_id'),
            'status' => $request->get('status'),
        ]);

        return response()->json([
            'data' => $rows->map->toApiArray()->values(),
        ]);
    }

    public function pendingPayments()
    {
        $rows = LicensePayment::query()
            ->with(['proofs', 'institution', 'invoice'])
            ->whereIn('status', ['pending', 'pending_verification'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $rows->map->toApiArray()->values(),
        ]);
    }

    public function auditLogs(Request $request)
    {
        $rows = app(LicenseAuditService::class)->list([
            'institution_id' => $request->get('institution_id'),
            'entity_type' => $request->get('entity_type'),
            'limit' => $request->get('limit', 100),
        ]);

        return response()->json([
            'data' => $rows->map->toApiArray()->values(),
        ]);
    }

    public function discounts(Request $request)
    {
        if (! Schema::hasTable('license_discounts')) {
            return response()->json(['data' => []]);
        }

        $query = LicenseDiscount::query()->orderByDesc('id');
        if ($request->get('institution_id')) {
            $query->where('institution_id', $request->get('institution_id'));
        }

        return response()->json([
            'data' => $query->get()->map->toApiArray()->values(),
        ]);
    }

    public function storeDiscount(Request $request)
    {
        if (! Schema::hasTable('license_discounts')) {
            return response()->json(['message' => 'Discounts table is not available.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'institution_id' => 'nullable|integer|exists:institutions,id',
            'institution_license_id' => 'nullable|integer|exists:institution_licenses,id',
            'institution_semester_license_id' => 'nullable|integer|exists:institution_semester_licenses,id',
            'license_invoice_id' => 'nullable|integer|exists:license_invoices,id',
            'discount_type' => 'required|string|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'reason' => 'nullable|string|max:1000',
            'expires_at' => 'nullable|date',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $discount = LicenseDiscount::create(array_merge($data, [
            'status' => 'active',
            'currency' => $data['currency'] ?? 'XAF',
            'created_by' => optional($request->user())->id,
        ]));

        app(LicenseAuditService::class)->log([
            'institution_id' => $discount->institution_id,
            'institution_semester_license_id' => $discount->institution_semester_license_id,
            'entity_type' => 'license_discount',
            'entity_id' => $discount->id,
            'action' => 'create',
            'new_value' => $discount->amount,
            'reason' => $discount->reason,
            'acted_by' => optional($request->user())->id,
        ]);

        return response()->json([
            'message' => 'Discount recorded.',
            'data' => $discount->toApiArray(),
        ], 201);
    }

    public function recordPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|integer|exists:institutions,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|max:10',
            'method' => 'nullable|string|max:40',
            'reference' => 'nullable|string|max:120',
            'notes' => 'nullable|string',
            'license_invoice_id' => 'nullable|integer|exists:license_invoices,id',
            'institution_semester_license_id' => 'nullable|integer|exists:institution_semester_licenses,id',
            'allocation_type' => 'nullable|string|max:40',
            'auto_verify' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payment = $this->billing->recordPayment($validator->validated(), optional($request->user())->id);

        return response()->json([
            'message' => 'Payment recorded.',
            'data' => $payment->toApiArray(),
        ], 201);
    }

    public function verifyPayment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'approve' => 'required|boolean',
            'reason' => 'nullable|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (! $request->boolean('approve') && ! $request->get('reason')) {
            return response()->json(['message' => 'Rejection reason is required.'], 422);
        }

        $payment = LicensePayment::with(['proofs', 'allocations'])->findOrFail($id);
        $updated = $this->billing->verifyPayment(
            $payment,
            $request->boolean('approve'),
            $request->get('reason'),
            optional($request->user())->id
        );

        return response()->json([
            'message' => $request->boolean('approve') ? 'Payment verified.' : 'Payment rejected.',
            'data' => $updated->toApiArray(),
        ]);
    }
}
