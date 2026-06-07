<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use TranslatesForUser;

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

    public function methods(Request $request)
    {
        $institutionId = null;
        if ($request->filled('application_id')) {
            $application = Application::find($request->application_id);
            $institutionId = $application ? $application->institution_id : null;
        }
        if (! $institutionId && auth()->user()) {
            $institutionId = auth()->user()->institution_id;
        }

        return response()->json([
            'success' => true,
            'data' => $this->paymentService->getAvailableMethods($institutionId ? (int) $institutionId : null),
        ]);
    }

    protected function initiatePayment(Request $request, $type)
    {
        $request->validate(['application_id' => 'required|exists:applications,id']);

        $application = Application::with(['applicant', 'programme'])->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        if ($type === 'application_fee') {
            if (! $application->canPayApplicationFee()) {
                return response()->json(['success' => false, 'message' => $this->transForUser('admissions.fee_cannot_pay')], 400);
            }
            $amount = $application->application_fee;
        } else {
            if (! $application->canPayTuition()) {
                return response()->json(['success' => false, 'message' => $this->transForUser('admissions.tuition_cannot_pay')], 400);
            }
            $amount = $application->tuition_fee;
        }

        $paymentLink = $this->paymentService->initializePayment($application, $type, $amount);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.payment_initialized'),
            'data' => $paymentLink,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate(['transaction_id' => 'required|string']);

        $verificationResult = $this->paymentService->verifyPayment($request->transaction_id);

        if (! $verificationResult) {
            return response()->json(['success' => false, 'message' => $this->transForUser('admissions.payment_failed')], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.payment_verified'),
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
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $result = $this->paymentService->confirmOfflinePayment($application, $request->payment_type);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.payment_recorded'),
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
