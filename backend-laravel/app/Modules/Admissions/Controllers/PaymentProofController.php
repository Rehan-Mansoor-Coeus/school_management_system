<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Modules\Admissions\Resources\ApplicationPaymentResource;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentProofController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    protected $paymentService;

    public function __construct()
    {
        $this->paymentService = new PaymentService();
        $this->middleware('auth:api');
    }

    public function submitApplicationFeeProof(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'proof_notes' => 'nullable|string|max:1000',
            'payment_reference' => 'nullable|string|max:255',
        ]);

        $application = Application::with('applicant')->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        if (! $application->canSubmitApplicationFeeProof()) {
            $message = $application->hasPendingApplicationFeeProof()
                ? $this->transForUser('admissions.fee_proof_already_pending')
                : $this->transForUser('admissions.fee_proof_cannot_submit');

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 400);
        }

        try {
            $payment = $this->paymentService->submitApplicationFeeProof(
                $application,
                $request->file('proof'),
                $request->proof_notes,
                $request->payment_reference
            );
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.fee_proof_submitted'),
            'data' => new ApplicationPaymentResource($payment),
        ], 201);
    }

    public function submitTuitionProof(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'proof_notes' => 'nullable|string|max:1000',
            'payment_reference' => 'nullable|string|max:255',
        ]);

        $application = Application::with(['applicant', 'programme'])->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        if (! $application->canSubmitTuitionProof()) {
            $message = $application->hasPendingTuitionProof()
                ? $this->transForUser('admissions.fee_proof_already_pending')
                : $this->transForUser('admissions.tuition_cannot_pay');

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 400);
        }

        try {
            $payment = $this->paymentService->submitTuitionProof(
                $application,
                $request->file('proof'),
                $request->proof_notes,
                $request->payment_reference
            );
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.fee_proof_submitted'),
            'data' => new ApplicationPaymentResource($payment),
        ], 201);
    }

    public function pendingProofs(Request $request)
    {
        $institutionId = $this->institutionId();
        $paymentType = $request->get('payment_type', 'application_fee');

        $proofs = $this->paymentService->listPendingProofs($institutionId, $paymentType);

        return response()->json([
            'success' => true,
            'data' => ApplicationPaymentResource::collection($proofs),
        ]);
    }

    public function approve($paymentId)
    {
        $payment = $this->findReviewablePayment($paymentId);

        try {
            $payment = $this->paymentService->approvePaymentProof($payment, auth()->id(), request('review_notes'));
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.fee_proof_approved'),
            'data' => new ApplicationPaymentResource($payment),
        ]);
    }

    public function reject(Request $request, $paymentId)
    {
        $request->validate([
            'review_notes' => 'required|string|max:1000',
        ]);

        $payment = $this->findReviewablePayment($paymentId);

        try {
            $payment = $this->paymentService->rejectPaymentProof($payment, auth()->id(), $request->review_notes);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.fee_proof_rejected'),
            'data' => new ApplicationPaymentResource($payment),
        ]);
    }

    protected function findReviewablePayment($paymentId)
    {
        return ApplicationPayment::where('institution_id', $this->institutionId())
            ->pendingProof()
            ->with(['application.applicant', 'application.programme'])
            ->findOrFail($paymentId);
    }
}
