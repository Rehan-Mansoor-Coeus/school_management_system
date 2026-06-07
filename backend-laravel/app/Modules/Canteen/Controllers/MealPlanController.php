<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenMeal;
use Illuminate\Http\Request;

class MealPlanController extends Controller
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
        $query = CanteenMeal::where('institution_id', $institutionId)->orderBy('sort_order')->orderBy('name');

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
            'code' => 'nullable|string|max:50',
            'meal_type' => 'required|in:breakfast,lunch,dinner,snack',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $meal = CanteenMeal::create(array_merge($data, [
            'institution_id' => $this->institutionId(),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]));

        return response()->json(['success' => true, 'message' => __('canteen.meal_created'), 'data' => $meal], 201);
    }

    public function update(Request $request, $id)
    {
        $meal = $this->findMeal($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_fr' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50',
            'meal_type' => 'sometimes|in:breakfast,lunch,dinner,snack',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $meal->update($data);

        return response()->json(['success' => true, 'message' => __('canteen.meal_updated'), 'data' => $meal->fresh()]);
    }

    public function destroy($id)
    {
        $meal = $this->findMeal($id);
        $meal->delete();

        return response()->json(['success' => true, 'message' => __('canteen.meal_deleted')]);
    }

    protected function findMeal($id): CanteenMeal
    {
        return CanteenMeal::where('institution_id', $this->institutionId())->findOrFail($id);
    }
}
