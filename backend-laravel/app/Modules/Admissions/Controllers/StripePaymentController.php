<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class StripePaymentController extends Controller
{
    use TranslatesForUser;

    protected $paymentService;

    public function __construct()
    {
        $this->middleware('auth:api')->except(['webhook']);
        $this->paymentService = new PaymentService();
    }

    public function createIntent(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'payment_type' => 'required|in:application_fee,tuition',
        ]);

        $application = Application::with(['applicant', 'programme'])->findOrFail($request->application_id);
        $this->authorizeApplicant($application);
        $application->syncFeesFromProgramme();

        $result = $this->paymentService->initializeStripePayment(
            $application,
            $request->payment_type
        );

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.stripe_not_configured'),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.payment_initialized'),
            'data' => $result,
        ]);
    }

    public function confirm(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $result = $this->paymentService->confirmStripePayment($request->payment_intent_id);

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.payment_failed'),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.payment_verified'),
            'data' => $result,
        ]);
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret');

        if ($secret && $sigHeader) {
            if (! $this->verifyStripeSignature($payload, $sigHeader, $secret)) {
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        }

        $event = json_decode($payload, true);
        $type = $event['type'] ?? '';

        if ($type === 'payment_intent.succeeded') {
            $intent = $event['data']['object'] ?? [];
            $this->paymentService->confirmStripePayment($intent['id'] ?? '');
        }

        return response()->json(['received' => true]);
    }

    protected function authorizeApplicant(Application $application): void
    {
        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }
    }

    protected function verifyStripeSignature(string $payload, string $sigHeader, string $secret): bool
    {
        $parts = [];
        foreach (explode(',', $sigHeader) as $element) {
            [$key, $value] = array_pad(explode('=', trim($element), 2), 2, null);
            if ($key && $value) {
                $parts[$key][] = $value;
            }
        }

        $timestamp = $parts['t'][0] ?? null;
        $signatures = $parts['v1'] ?? [];
        if (! $timestamp || ! $signatures) {
            return false;
        }

        $signedPayload = $timestamp.'.'.$payload;
        $expected = hash_hmac('sha256', $signedPayload, $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }
}
