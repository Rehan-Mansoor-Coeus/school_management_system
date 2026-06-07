<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenMeal;
use App\Modules\Canteen\Models\CanteenMealAttendance;
use App\Modules\Canteen\Models\CanteenSubscription;
use App\Modules\Canteen\Models\CanteenWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
    }

    public function summary(Request $request)
    {
        $institutionId = $this->institutionId();
        $from = $request->get('date_from', now()->startOfMonth()->toDateString());
        $to = $request->get('date_to', now()->toDateString());

        $attendanceQuery = CanteenMealAttendance::where('institution_id', $institutionId)
            ->where('status', 'served')
            ->whereDate('served_at', '>=', $from)
            ->whereDate('served_at', '<=', $to);

        $mealsServed = (clone $attendanceQuery)->count();
        $walletRevenue = (clone $attendanceQuery)->where('payment_source', 'wallet')->sum('amount_charged');
        $subscriptionMeals = (clone $attendanceQuery)->where('payment_source', 'subscription')->count();

        $byMeal = CanteenMealAttendance::select('meal_id', DB::raw('count(*) as total'))
            ->where('institution_id', $institutionId)
            ->where('status', 'served')
            ->whereDate('served_at', '>=', $from)
            ->whereDate('served_at', '<=', $to)
            ->groupBy('meal_id')
            ->with('meal')
            ->get();

        $byDay = CanteenMealAttendance::select(DB::raw('DATE(served_at) as day'), DB::raw('count(*) as total'))
            ->where('institution_id', $institutionId)
            ->where('status', 'served')
            ->whereDate('served_at', '>=', $from)
            ->whereDate('served_at', '<=', $to)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['from' => $from, 'to' => $to],
                'meals_served' => $mealsServed,
                'wallet_revenue' => round((float) $walletRevenue, 2),
                'subscription_meals' => $subscriptionMeals,
                'active_wallets' => CanteenWallet::where('institution_id', $institutionId)->where('is_active', true)->count(),
                'active_subscriptions' => CanteenSubscription::where('institution_id', $institutionId)->where('status', 'active')->count(),
                'by_meal' => $byMeal,
                'by_day' => $byDay,
                'meal_types' => CanteenMeal::where('institution_id', $institutionId)->where('is_active', true)->get(['id', 'name', 'meal_type', 'price']),
            ],
        ]);
    }
}
