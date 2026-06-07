<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenFeedingPlan;
use App\Modules\Canteen\Models\CanteenMeal;
use App\Modules\Canteen\Models\CanteenMealAttendance;
use App\Modules\Canteen\Models\CanteenSubscription;
use App\Modules\Canteen\Models\CanteenWallet;
use App\Student;

class DashboardController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
    }

    public function index()
    {
        $institutionId = $this->institutionId();
        $today = now()->toDateString();

        return response()->json([
            'success' => true,
            'data' => [
                'meals_today' => CanteenMealAttendance::where('institution_id', $institutionId)
                    ->where('status', 'served')
                    ->whereDate('served_at', $today)
                    ->count(),
                'active_meal_plans' => CanteenMeal::where('institution_id', $institutionId)->where('is_active', true)->count(),
                'feeding_plans' => CanteenFeedingPlan::where('institution_id', $institutionId)->where('is_active', true)->count(),
                'student_wallets' => CanteenWallet::where('institution_id', $institutionId)->where('is_active', true)->count(),
                'active_subscriptions' => CanteenSubscription::where('institution_id', $institutionId)->where('status', 'active')->count(),
                'students_count' => Student::where('institution_id', $institutionId)->where('is_active', true)->count(),
            ],
        ]);
    }
}
