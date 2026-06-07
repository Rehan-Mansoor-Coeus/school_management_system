<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenFeedingPlan;
use App\Modules\Canteen\Models\CanteenSubscription;
use App\Modules\Canteen\Services\CanteenWalletService;
use App\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    use ResolvesInstitution;

    protected $walletService;

    public function __construct(CanteenWalletService $walletService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
        $this->walletService = $walletService;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = CanteenSubscription::with(['student.user', 'feedingPlan', 'wallet'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'feeding_plan_id' => 'required|exists:canteen_feeding_plans,id',
            'pay_from_wallet' => 'nullable|boolean',
        ]);

        $institutionId = $this->institutionId();
        $student = Student::where('institution_id', $institutionId)->findOrFail($data['student_id']);
        $plan = CanteenFeedingPlan::where('institution_id', $institutionId)->findOrFail($data['feeding_plan_id']);
        $wallet = $this->walletService->ensureWallet($institutionId, $student->id);

        $subscription = DB::transaction(function () use ($institutionId, $student, $plan, $wallet, $data) {
            if (! empty($data['pay_from_wallet']) && (float) $plan->price > 0) {
                $this->walletService->debit(
                    $wallet,
                    (float) $plan->price,
                    'plan_purchase',
                    'Subscription: '.$plan->name
                );
            }

            return CanteenSubscription::create([
                'institution_id' => $institutionId,
                'student_id' => $student->id,
                'feeding_plan_id' => $plan->id,
                'wallet_id' => $wallet->id,
                'status' => 'active',
                'meals_remaining' => $plan->total_meals,
                'meals_used' => 0,
                'amount_paid' => $plan->price,
                'subscribed_at' => now(),
                'expires_at' => $plan->valid_to ? $plan->valid_to.' 23:59:59' : null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => __('canteen.subscription_created'),
            'data' => $subscription->load(['student.user', 'feedingPlan']),
        ], 201);
    }

    public function mySubscriptions()
    {
        $student = Student::where('institution_id', $this->institutionId())
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $items = CanteenSubscription::with('feedingPlan')
            ->where('institution_id', $this->institutionId())
            ->where('student_id', $student->id)
            ->orderByDesc('id')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
