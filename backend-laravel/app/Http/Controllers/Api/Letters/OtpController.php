<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Services\Messaging\OtpService;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    use ResolvesLettersContext;

    protected $otp;

    public function __construct(OtpService $otp)
    {
        $this->otp = $otp;
    }

    public function request(Request $request)
    {
        $request->validate([
            'module' => 'required|in:letter,announcement',
            'related_id' => 'nullable|integer',
            'action' => 'required|string|max:50',
            'context' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $result = $this->otp->requestOtp(
            $user,
            $this->institutionId($request),
            $request->module,
            $request->related_id,
            $request->action,
            $request->context
        );

        $status = ($result['success'] ?? false) ? 200 : 422;

        return response()->json($result, $status);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'module' => 'required|in:letter,announcement',
            'related_id' => 'nullable|integer',
            'action' => 'required|string|max:50',
            'otp' => 'required|string|max:10',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $result = $this->otp->verifyOtp(
            $user,
            $request->module,
            $request->related_id,
            $request->action,
            $request->otp
        );

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }
}
