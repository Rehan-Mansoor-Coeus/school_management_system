<?php

namespace App\Modules\Admissions\Controllers;

use App\Concerns\TranslatesForUser;
use App\Http\Controllers\Controller;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class PawaPayPaymentController extends Controller
{
    use TranslatesForUser;

    protected $paymentService;

    public function __construct()
    {
        $this->middleware('auth:api')->except(['callback']);
        $this->paymentService = new PaymentService();
    }

    public function quote(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'payment_type' => 'required|in:application_fee,tuition',
            'phone' => 'nullable|string|max:20',
        ]);

        $application = Application::with(['applicant', 'programme', 'institution'])->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        try {
            $result = $this->paymentService->quotePawapayPayment(
                $application,
                $request->payment_type,
                (string) $request->input('phone', '')
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function collect(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'payment_type' => 'required|in:application_fee,tuition',
            'phone' => 'required|string|min:8|max:20',
            'provider' => 'nullable|string|max:40',
        ]);

        $application = Application::with(['applicant', 'programme', 'institution'])->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        try {
            $result = $this->paymentService->initializePawapayPayment(
                $application,
                $request->payment_type,
                $request->phone,
                $request->input('provider')
            );
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.pawapay_failed'),
            ], 400);
        }

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.pawapay_failed'),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.pawapay_initiated'),
            'data' => $result,
        ]);
    }

    public function status($depositId)
    {
        $result = $this->paymentService->verifyPawapayPayment($depositId);

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.payment_pending'),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function callback(Request $request)
    {
        $this->paymentService->processPawapayCallback($request->all());

        return response()->json(['status' => 'ok']);
    }
}
