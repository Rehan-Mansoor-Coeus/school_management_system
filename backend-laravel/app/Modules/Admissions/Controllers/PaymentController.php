<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\TranslatesAdmissions;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use TranslatesAdmissions;

    protected $paymentService;

    public function __construct()
    {
        $this->paymentService = new PaymentService();
        $this->middleware('auth:api')->except(['webhook', 'verify']);
    }

    public function initiateApplicationFee(Request $request)
    {
        return $this->initiatePayment($request, 'application_fee');
    }

    public function initiateTuition(Request $request)
    {
        return $this->initiatePayment($request, 'tuition');
    }

    protected function initiatePayment(Request $request, $type)
    {
        $request->validate(['application_id' => 'required|exists:applications,id']);

        $application = Application::with('applicant')->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->admissionsTrans('unauthorized'));
        }

        if ($type === 'application_fee') {
            if (! $application->canPayApplicationFee()) {
                return response()->json(['success' => false, 'message' => $this->admissionsTrans('fee_cannot_pay')], 400);
            }
            $amount = $application->application_fee;
        } else {
            if (! $application->canPayTuition()) {
                return response()->json(['success' => false, 'message' => $this->admissionsTrans('tuition_cannot_pay')], 400);
            }
            $amount = $application->tuition_fee;
        }

        $paymentLink = $this->paymentService->initializePayment($application, $type, $amount);

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('payment_initialized'),
            'data' => $paymentLink,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate(['transaction_id' => 'required|string']);

        $verificationResult = $this->paymentService->verifyPayment($request->transaction_id);

        if (! $verificationResult) {
            return response()->json(['success' => false, 'message' => $this->admissionsTrans('payment_failed')], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('payment_verified'),
            'data' => $verificationResult,
        ]);
    }

    public function confirmOffline(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'payment_type' => 'required|in:application_fee,tuition',
        ]);

        $application = Application::with('applicant')->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->admissionsTrans('unauthorized'));
        }

        $result = $this->paymentService->confirmOfflinePayment($application, $request->payment_type);

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('payment_recorded'),
            'data' => $result,
        ]);
    }

    public function webhook(Request $request)
    {
        try {
            $this->paymentService->processPaymentWebhook($request->all());

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            \Log::error('Webhook processing error: '.$e->getMessage());

            return response()->json(['status' => 'error'], 500);
        }
    }
}
