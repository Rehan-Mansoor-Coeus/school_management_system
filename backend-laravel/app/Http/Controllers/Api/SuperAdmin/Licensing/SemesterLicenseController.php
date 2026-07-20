<?php

namespace App\Http\Controllers\Api\SuperAdmin\Licensing;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Institution;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Services\SemesterLicenseService;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SemesterLicenseController extends Controller
{
    protected $service;

    public function __construct(SemesterLicenseService $service)
    {
        $this->service = $service;
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage semester licenses.');
            }

            return $next($request);
        });
    }

    public function index(Request $request)
    {
        $rows = $this->service->list([
            'institution_id' => $request->get('institution_id'),
            'status' => $request->get('status'),
            'academic_year_id' => $request->get('academic_year_id'),
            'search' => $request->get('search'),
        ]);

        return response()->json([
            'data' => $rows->map(function ($row) {
                return array_merge($row->toApiArray(), [
                    'institution' => $row->institution ? [
                        'id' => $row->institution->id,
                        'name' => $row->institution->name,
                        'code' => $row->institution->code,
                    ] : null,
                ]);
            })->values(),
        ]);
    }

    public function show($id)
    {
        $license = InstitutionSemesterLicense::with(['plan', 'academicYear', 'institution', 'invoices', 'snapshots', 'adjustments'])
            ->findOrFail($id);

        return response()->json([
            'data' => array_merge($license->toApiArray(), [
                'institution' => $license->institution ? [
                    'id' => $license->institution->id,
                    'name' => $license->institution->name,
                    'code' => $license->institution->code,
                ] : null,
                'invoices' => $license->invoices->map->toApiArray()->values(),
                'snapshots' => $license->snapshots,
                'adjustments' => $license->adjustments,
            ]),
        ]);
    }

    public function academicYears(Institution $institution)
    {
        $years = AcademicYear::where('institution_id', $institution->id)
            ->orderByDesc('is_current')
            ->orderByDesc('start_year')
            ->get(['id', 'name', 'code', 'start_year', 'end_year', 'is_current', 'is_active']);

        return response()->json(['data' => $years]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|integer|exists:institutions,id',
            'license_plan_id' => 'required|integer|exists:license_plans,id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'semester_name' => 'required|string|max:40',
            'semester_id' => 'nullable|integer',
            'institution_license_id' => 'nullable|integer|exists:institution_licenses,id',
            'estimated_students' => 'nullable|integer|min:0',
            'estimate_reason' => 'nullable|string|max:1000',
            'student_count_lock_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $institution = Institution::findOrFail($data['institution_id']);

        try {
            $license = $this->service->createForSemester($institution, $data, optional($request->user())->id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Semester license created. Down-payment invoice generated.',
            'data' => $license->toApiArray(),
        ], 201);
    }

    public function syncUsage($id)
    {
        $license = InstitutionSemesterLicense::findOrFail($id);
        $count = $this->service->syncUsageFromStudents($license);

        return response()->json([
            'message' => 'Usage synced.',
            'projected_students' => $count,
            'data' => $license->fresh(['plan', 'academicYear', 'institution'])->toApiArray(),
        ]);
    }

    public function lock(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'override_count' => 'nullable|integer|min:0',
            'reason' => 'nullable|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $license = InstitutionSemesterLicense::findOrFail($id);
        try {
            $updated = $this->service->lockCount(
                $license,
                $request->has('override_count') ? (int) $request->get('override_count') : null,
                $request->get('reason'),
                optional($request->user())->id
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Student count locked.',
            'data' => $updated->toApiArray(),
        ]);
    }

    public function reconcile(Request $request, $id)
    {
        $license = InstitutionSemesterLicense::findOrFail($id);
        $updated = $this->service->reconcile($license, optional($request->user())->id);

        return response()->json([
            'message' => 'Semester license reconciled.',
            'data' => $updated->toApiArray(),
        ]);
    }

    public function additionalStudents(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:1000',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $license = InstitutionSemesterLicense::findOrFail($id);
        try {
            $updated = $this->service->recordAdditionalStudents(
                $license,
                (int) $request->get('quantity'),
                $request->get('reason'),
                optional($request->user())->id
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Additional student charge recorded.',
            'data' => $updated->toApiArray(),
        ]);
    }
}
