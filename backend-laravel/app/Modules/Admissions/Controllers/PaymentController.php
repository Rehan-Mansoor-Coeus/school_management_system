<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct()
    {
        $this->paymentService = new PaymentService();
        $this->middleware('auth:api')->except('verify', 'webhook');
    }

    /**
     * Initialize payment for application fee
     */
    public function initiate(Request $request)
    {
        try {
            $applicationId = $request->application_id;
            $application = Application::findOrFail($applicationId);

            // Check authorization
            if ($application->applicant->user_id !== auth()->id()) {
                abort(403, 'Unauthorized');
            }

            if ($application->application_fee_paid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application fee already paid.',
                ], 400);
            }

            $paymentLink = $this->paymentService->initializePayment($application);

            return response()->json([
                'success' => true,
                'message' => 'Payment link generated.',
                'data' => $paymentLink,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify payment
     */
    public function verify(Request $request)
    {
        try {
            $transactionId = $request->transaction_id;

            $verificationResult = $this->paymentService->verifyPayment($transactionId);

            if (!$verificationResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully.',
                'data' => $verificationResult,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Verification failed.',
            ], 500);
        }
    }

    /**
     * Webhook for Flutterwave
     */
    public function webhook(Request $request)
    {
        try {
            $payload = $request->all();

            $this->paymentService->processPaymentWebhook($payload);

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            \Log::error('Webhook processing error: ' . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }
}
