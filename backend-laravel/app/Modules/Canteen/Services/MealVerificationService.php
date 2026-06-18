<?php

namespace App\Modules\Canteen\Services;

use App\Modules\Canteen\Models\CanteenMeal;
use App\Modules\Canteen\Models\CanteenMealAttendance;
use App\Modules\Canteen\Models\CanteenSubscription;
use App\Student;
use Illuminate\Support\Facades\DB;

class MealVerificationService
{
    protected $walletService;

    public function __construct(CanteenWalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function lookup(int $institutionId, string $code): array
    {
        $student = $this->walletService->resolveStudentByCode($institutionId, $code);
        if (! $student) {
            throw new \RuntimeException(__('canteen.student_not_found'));
        }

        $wallet = $this->walletService->ensureWallet($institutionId, $student->id);
        $student->load(['user', 'programme']);

        $subscription = CanteenSubscription::with('feedingPlan')
            ->where('institution_id', $institutionId)
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->where('meals_remaining', '>', 0)
            ->orderByDesc('id')
            ->first();

        return [
            'student' => $student,
            'wallet' => $wallet,
            'subscription' => $subscription,
            'qr_payload' => $wallet->qrPayload(),
        ];
    }

    public function serveMeal(
        int $institutionId,
        int $studentId,
        int $mealId,
        string $verificationMethod = 'qr',
        ?string $notes = null
    ): CanteenMealAttendance {
        return DB::transaction(function () use ($institutionId, $studentId, $mealId, $verificationMethod, $notes) {
            $meal = CanteenMeal::where('institution_id', $institutionId)
                ->where('id', $mealId)
                ->where('is_active', true)
                ->firstOrFail();

            $wallet = $this->walletService->ensureWallet($institutionId, $studentId);
            $amountCharged = 0;
            $paymentSource = 'wallet';
            $subscriptionId = null;
            $transactionId = null;

            $subscription = $this->findApplicableSubscription($institutionId, $studentId, $meal);
            if ($subscription) {
                $subscription->meals_remaining -= 1;
                $subscription->meals_used += 1;
                if ($subscription->meals_remaining <= 0) {
                    $subscription->status = 'expired';
                }
                $subscription->save();
                $subscriptionId = $subscription->id;
                $paymentSource = 'subscription';
            } else {
                $price = (float) $meal->price;
                if ($price > 0) {
                    $transaction = $this->walletService->debit(
                        $wallet,
                        $price,
                        'meal_payment',
                        __('canteen.meal_payment_note', ['meal' => $meal->name])
                    );
                    $transactionId = $transaction->id;
                    $amountCharged = $price;
                } else {
                    $paymentSource = 'free';
                }
            }

            return CanteenMealAttendance::create([
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'meal_id' => $meal->id,
                'subscription_id' => $subscriptionId,
                'wallet_transaction_id' => $transactionId,
                'served_at' => now(),
                'verification_method' => $verificationMethod,
                'verified_by' => optional(auth()->user())->id,
                'amount_charged' => $amountCharged,
                'payment_source' => $paymentSource,
                'status' => 'served',
                'notes' => $notes,
            ]);
        });
    }

    protected function findApplicableSubscription(int $institutionId, int $studentId, CanteenMeal $meal): ?CanteenSubscription
    {
        $subscriptions = CanteenSubscription::with(['feedingPlan.meals'])
            ->where('institution_id', $institutionId)
            ->where('student_id', $studentId)
            ->where('status', 'active')
            ->where('meals_remaining', '>', 0)
            ->get();

        foreach ($subscriptions as $subscription) {
            if (! $subscription->isActive()) {
                continue;
            }

            $plan = $subscription->feedingPlan;
            if (! $plan) {
                continue;
            }

            $mealPivot = $plan->meals->firstWhere('id', $meal->id);
            if ($mealPivot && (int) $mealPivot->pivot->allowance > 0) {
                $usedForMeal = CanteenMealAttendance::where('subscription_id', $subscription->id)
                    ->where('meal_id', $meal->id)
                    ->where('status', 'served')
                    ->count();
                if ($usedForMeal < (int) $mealPivot->pivot->allowance) {
                    return $subscription;
                }
                continue;
            }

            if ($plan->meals->isEmpty() && $subscription->meals_remaining > 0) {
                return $subscription;
            }
        }

        return null;
    }
}
