<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;

class CampayPaymentController extends Controller
{
    use TranslatesForUser;

    protected $paymentService;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->paymentService = new PaymentService();
    }

    public function collect(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'payment_type' => 'required|in:application_fee,tuition',
            'phone' => 'required|string|min:9|max:20',
        ]);

        $application = Application::with(['applicant', 'programme'])->findOrFail($request->application_id);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        $result = $this->paymentService->initializeCampayPayment(
            $application,
            $request->payment_type,
            $request->phone
        );

        if (! $result) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.campay_failed'),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.campay_initiated'),
            'data' => $result,
        ]);
    }

    public function status($reference)
    {
        $result = $this->paymentService->verifyCampayPayment($reference);

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
}
