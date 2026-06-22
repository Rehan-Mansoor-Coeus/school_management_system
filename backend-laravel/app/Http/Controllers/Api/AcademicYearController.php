<?php

namespace App\Http\Controllers\Api;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesScopedInstitution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AcademicYearController extends Controller
{
    use ResolvesScopedInstitution;

    public function index(Request $request)
    {
        $institutionId = $this->scopedInstitutionId($request);
        if (! $institutionId) {
            return response()->json(['message' => 'Institution is required.'], 422);
        }

        $years = AcademicYear::where('institution_id', $institutionId)
            ->orderByDesc('is_current')
            ->orderByDesc('start_year')
            ->get();

        return response()->json(['data' => $years]);
    }

    public function store(Request $request)
    {
        $institutionId = $this->scopedInstitutionId($request);
        if (! $institutionId) {
            return response()->json(['message' => 'Institution is required.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'start_year' => 'required|integer|min:2000|max:2100',
            'end_year' => 'required|integer|min:2000|max:2101|gte:start_year',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->boolean('is_current')) {
            AcademicYear::where('institution_id', $institutionId)->update(['is_current' => false]);
        }

        $year = AcademicYear::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'code' => 'AY'.$request->start_year.'-'.$request->end_year,
            'start_year' => (int) $request->start_year,
            'end_year' => (int) $request->end_year,
            'start_date' => $request->start_date ?: $request->start_year.'-09-01',
            'end_date' => $request->end_date ?: $request->end_year.'-08-31',
            'is_current' => $request->boolean('is_current', false),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json(['message' => 'Academic year created.', 'data' => $year], 201);
    }
}
