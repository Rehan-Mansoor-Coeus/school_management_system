<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function categories()
    {
        return response()->json([
            'success' => true,
            'data' => \App\Modules\Hr\Models\HrStaffCategory::where('institution_id', $this->institutionId())->orderBy('name')->get(),
        ]);
    }

    public function storeCategory(Request $request)
    {
        $payload = $request->validate(['name' => 'required|string|max:120', 'code' => 'nullable|string|max:50', 'description' => 'nullable|string']);
        $payload['institution_id'] = $this->institutionId();
        $payload['code'] = $payload['code'] ?? strtoupper(preg_replace('/[^a-z0-9]+/i', '_', $payload['name']));
        $payload['is_active'] = true;

        $item = \App\Modules\Hr\Models\HrStaffCategory::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrStaffCategory::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['name','description','is_active']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function deleteCategory($id)
    {
        $item = \App\Modules\Hr\Models\HrStaffCategory::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

    public function positionRates()
    {
        return response()->json(['success' => true, 'data' => \App\Modules\Hr\Models\HrPositionRate::where('institution_id', $this->institutionId())->orderBy('position')->get()]);
    }

    public function storePositionRate(Request $request)
    {
        $payload = $request->validate(['position' => 'required|string|max:120', 'daily_rate' => 'required|numeric|min:0']);
        $payload['institution_id'] = $this->institutionId();
        $payload['is_active'] = true;

        $item = \App\Modules\Hr\Models\HrPositionRate::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function updatePositionRate(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrPositionRate::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['position','daily_rate','is_active']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function deletePositionRate($id)
    {
        $item = \App\Modules\Hr\Models\HrPositionRate::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

    public function allowanceTypes()
    {
        return response()->json(['success' => true, 'data' => \App\Modules\Hr\Models\HrAllowanceType::where('institution_id', $this->institutionId())->orderBy('name')->get()]);
    }

    public function storeAllowanceType(Request $request)
    {
        $payload = $request->validate(['name' => 'required|string|max:120', 'code' => 'nullable|string|max:50', 'default_amount' => 'nullable|numeric|min:0']);
        $payload['institution_id'] = $this->institutionId();
        $payload['code'] = $payload['code'] ?? strtoupper(substr(md5($payload['name']), 0, 8));
        $payload['default_amount'] = $payload['default_amount'] ?? 0;
        $payload['is_active'] = true;
        $item = \App\Modules\Hr\Models\HrAllowanceType::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function updateAllowanceType(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrAllowanceType::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['name','default_amount','is_active']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function deleteAllowanceType($id)
    {
        $item = \App\Modules\Hr\Models\HrAllowanceType::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

    public function deductionTypes()
    {
        return response()->json(['success' => true, 'data' => \App\Modules\Hr\Models\HrDeductionType::where('institution_id', $this->institutionId())->orderBy('name')->get()]);
    }

    public function storeDeductionType(Request $request)
    {
        $payload = $request->validate(['name' => 'required|string|max:120', 'code' => 'nullable|string|max:50', 'default_amount' => 'nullable|numeric|min:0']);
        $payload['institution_id'] = $this->institutionId();
        $payload['code'] = $payload['code'] ?? strtoupper(substr(md5($payload['name']), 0, 8));
        $payload['default_amount'] = $payload['default_amount'] ?? 0;
        $payload['is_active'] = true;
        $item = \App\Modules\Hr\Models\HrDeductionType::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function updateDeductionType(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrDeductionType::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['name','default_amount','is_active']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function deleteDeductionType($id)
    {
        $item = \App\Modules\Hr\Models\HrDeductionType::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

}
