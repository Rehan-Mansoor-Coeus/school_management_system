<?php

namespace App\Http\Controllers\Api;

use App\AcademicUnit;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesScopedInstitution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AcademicUnitController extends Controller
{
    use ResolvesScopedInstitution;

    protected function institutionId(Request $request)
    {
        $id = $this->scopedInstitutionId($request);
        if (! $id) {
            abort(422, 'Institution is required.');
        }
        return (int) $id;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId($request);

        $query = AcademicUnit::query()->where('institution_id', $institutionId);

        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)->orWhere('unit_type', 'like', $term);
            });
        }

        if ($request->filled('unit_type')) {
            $query->where('unit_type', $request->unit_type);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $institutionId = $this->institutionId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'unit_type' => ['required', Rule::in(['school', 'faculty', 'institute', 'research_center', 'department', 'college', 'other'])],
            'description' => 'nullable|string|max:2000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $unit = AcademicUnit::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'unit_type' => $request->unit_type,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($unit, 201);
    }

    public function update(Request $request, AcademicUnit $academicUnit)
    {
        if (! $this->canManageInstitution($request, $academicUnit->institution_id)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'unit_type' => ['required', Rule::in(['school', 'faculty', 'institute', 'research_center', 'department', 'college', 'other'])],
            'description' => 'nullable|string|max:2000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $academicUnit->update([
            'name' => $request->name,
            'unit_type' => $request->unit_type,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', $academicUnit->is_active),
        ]);

        return response()->json($academicUnit->fresh());
    }

    public function destroy(Request $request, AcademicUnit $academicUnit)
    {
        if (! $this->canManageInstitution($request, $academicUnit->institution_id)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $academicUnit->delete();

        return response()->json(['message' => 'Academic unit deleted.']);
    }
}
