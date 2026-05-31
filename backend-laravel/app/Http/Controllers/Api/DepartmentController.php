<?php

namespace App\Http\Controllers\Api;

use App\Department;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    protected function resolveInstitutionId(Request $request)
    {
        if ($request->user() && $request->user()->institution_id) {
            return $request->user()->institution_id;
        }

        return $request->input('institution_id');
    }

    protected function authorizeDepartment(Department $department, Request $request)
    {
        if ($request->user() && $request->user()->institution_id) {
            return (int) $department->institution_id === (int) $request->user()->institution_id;
        }

        return true;
    }

    public function index(Request $request)
    {
        $query = Department::with('institution');

        if ($request->user() && $request->user()->institution_id) {
            $query->where('institution_id', $request->user()->institution_id);
        } elseif ($request->filled('institution_id')) {
            $query->where('institution_id', $request->institution_id);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $institutionId = $this->resolveInstitutionId($request);

        if (! $institutionId) {
            return response()->json(['message' => 'Institution must be selected.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'institution_id' => 'sometimes|integer|exists:institutions,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments')->where(function ($query) use ($institutionId) {
                    return $query->where('institution_id', $institutionId);
                }),
            ],
            'description' => 'nullable|string|max:1000',
            'hod_id' => 'nullable|integer|exists:users,id',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'office_location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'hod_id' => $request->hod_id,
            'phone' => $request->phone,
            'email' => $request->email,
            'office_location' => $request->office_location,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
        ]);

        return response()->json(['message' => 'Department created successfully.', 'department' => $department->load('institution')], 201);
    }

    public function update(Request $request, Department $department)
    {
        if (! $this->authorizeDepartment($department, $request)) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        $institutionId = $this->resolveInstitutionId($request) ?: $department->institution_id;

        $validator = Validator::make($request->all(), [
            'institution_id' => 'sometimes|integer|exists:institutions,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments')->ignore($department->id)->where(function ($query) use ($institutionId) {
                    return $query->where('institution_id', $institutionId);
                }),
            ],
            'description' => 'nullable|string|max:1000',
            'hod_id' => 'nullable|integer|exists:users,id',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'office_location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department->update([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'hod_id' => $request->hod_id,
            'phone' => $request->phone,
            'email' => $request->email,
            'office_location' => $request->office_location,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $department->is_active,
        ]);

        return response()->json(['message' => 'Department updated successfully.', 'department' => $department->fresh()->load('institution')]);
    }

    public function destroy(Request $request, Department $department)
    {
        if (! $this->authorizeDepartment($department, $request)) {
            return response()->json(['message' => 'Department not found.'], 404);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted successfully.']);
    }
}
