<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Services\MealVerificationService;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    use ResolvesInstitution;

    protected $verificationService;

    public function __construct(MealVerificationService $verificationService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
        $this->verificationService = $verificationService;
    }

    public function lookup(Request $request)
    {
        $data = $request->validate(['code' => 'required|string|max:255']);

        try {
            $result = $this->verificationService->lookup($this->institutionId(), $data['code']);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $student = $result['student'];
        $wallet = $result['wallet'];
        $subscription = $result['subscription'];

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'name' => optional($student->user)->name,
                    'email' => optional($student->user)->email,
                    'programme' => optional($student->programme)->name,
                ],
                'wallet' => [
                    'id' => $wallet->id,
                    'wallet_number' => $wallet->wallet_number,
                    'balance' => $wallet->balance,
                    'qr_payload' => $result['qr_payload'],
                ],
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'plan_name' => optional($subscription->feedingPlan)->name,
                    'meals_remaining' => $subscription->meals_remaining,
                ] : null,
            ],
        ]);
    }

    public function serve(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'meal_id' => 'required|exists:canteen_meals,id',
            'verification_method' => 'nullable|in:qr,id,wallet',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $attendance = $this->verificationService->serveMeal(
                $this->institutionId(),
                (int) $data['student_id'],
                (int) $data['meal_id'],
                $data['verification_method'] ?? 'qr',
                $data['notes'] ?? null
            );
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => __('canteen.meal_served'),
            'data' => $attendance->load(['meal', 'student.user']),
        ]);
    }
}
