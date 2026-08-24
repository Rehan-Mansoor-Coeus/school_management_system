<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PawaPayCallbackController extends Controller
{
    public function deposits(Request $request)
    {
        (new PaymentService())->processPawapayCallback($request->all());

        return response()->json(['status' => 'ok']);
    }

    public function checkouts(Request $request)
    {
        Log::info('PawaPay checkout callback received');
        (new PaymentService())->processPawapayCallback($request->all());

        return response()->json(['status' => 'ok']);
    }

    public function payouts()
    {
        return response()->json(['status' => 'ok']);
    }

    public function refunds()
    {
        return response()->json(['status' => 'ok']);
    }
}
