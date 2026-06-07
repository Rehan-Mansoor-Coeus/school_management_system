<?php

namespace App\Modules\Canteen\Controllers;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenFeedingPlan;
use Illuminate\Http\Request;

class FeedingPlanController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = CanteenFeedingPlan::with(['academicYear', 'meals'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('id');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'total_meals' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'nullable|boolean',
            'meals' => 'nullable|array',
            'meals.*.meal_id' => 'required_with:meals|exists:canteen_meals,id',
            'meals.*.allowance' => 'required_with:meals|integer|min:0',
        ]);

        $plan = CanteenFeedingPlan::create([
            'institution_id' => $this->institutionId(),
            'academic_year_id' => $data['academic_year_id'] ?? null,
            'name' => $data['name'],
            'name_fr' => $data['name_fr'] ?? null,
            'description' => $data['description'] ?? null,
            'total_meals' => $data['total_meals'],
            'price' => $data['price'],
            'valid_from' => $data['valid_from'] ?? null,
            'valid_to' => $data['valid_to'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $this->syncMeals($plan, $data['meals'] ?? []);

        return response()->json([
            'success' => true,
            'message' => __('canteen.feeding_plan_created'),
            'data' => $plan->load(['academicYear', 'meals']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $plan = $this->findPlan($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'total_meals' => 'sometimes|integer|min:1',
            'price' => 'sometimes|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'nullable|boolean',
            'meals' => 'nullable|array',
            'meals.*.meal_id' => 'required_with:meals|exists:canteen_meals,id',
            'meals.*.allowance' => 'required_with:meals|integer|min:0',
        ]);

        $plan->update(collect($data)->except('meals')->toArray());

        if (array_key_exists('meals', $data)) {
            $this->syncMeals($plan, $data['meals'] ?? []);
        }

        return response()->json([
            'success' => true,
            'message' => __('canteen.feeding_plan_updated'),
            'data' => $plan->fresh()->load(['academicYear', 'meals']),
        ]);
    }

    public function destroy($id)
    {
        $plan = $this->findPlan($id);
        $plan->delete();

        return response()->json(['success' => true, 'message' => __('canteen.feeding_plan_deleted')]);
    }

    public function referenceData()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'academic_years' => AcademicYear::where('institution_id', $institutionId)->orderByDesc('id')->get(['id', 'name', 'is_current']),
            ],
        ]);
    }

    protected function syncMeals(CanteenFeedingPlan $plan, array $meals): void
    {
        $sync = [];
        foreach ($meals as $row) {
            $sync[$row['meal_id']] = ['allowance' => $row['allowance']];
        }
        $plan->meals()->sync($sync);
    }

    protected function findPlan($id): CanteenFeedingPlan
    {
        return CanteenFeedingPlan::where('institution_id', $this->institutionId())->findOrFail($id);
    }
}
