<?php

namespace App\Modules\Hostel\Controllers;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\HostelAllocation;
use App\Modules\Hostel\Models\HostelRegistration;
use App\Modules\Hostel\Services\HostelAllocationService;
use App\Student;
use Illuminate\Http\Request;

class AllocationController extends Controller
{
    use ResolvesInstitution;

    protected $allocationService;

    public function __construct(HostelAllocationService $allocationService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
        $this->allocationService = $allocationService;
    }

    public function index(Request $request)
    {
        $query = HostelAllocation::where('institution_id', $this->institutionId())
            ->with(['student.user', 'room.hostel', 'bed', 'academicYear', 'clearance']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('hostel_id')) {
            $query->whereHas('room', function ($q) use ($request) {
                $q->where('hostel_id', $request->hostel_id);
            });
        }

        return response()->json(['success' => true, 'data' => $query->latest()->paginate(20)]);
    }

    public function myAllocation()
    {
        $student = $this->studentForUser();
        if (! $student) {
            return response()->json(['success' => false, 'message' => __('hostel.not_a_student')], 403);
        }

        $allocation = HostelAllocation::where('student_id', $student->id)
            ->whereIn('status', ['allocated', 'active'])
            ->with(['room.hostel', 'bed', 'academicYear', 'clearance', 'payments'])
            ->latest()
            ->first();

        return response()->json(['success' => true, 'data' => $allocation]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'room_id' => 'required|exists:rooms,id',
            'bed_id' => 'nullable|exists:hostel_beds,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'registration_id' => 'nullable|exists:hostel_registrations,id',
            'allocation_date' => 'nullable|date',
            'check_in_date' => 'nullable|date',
            'fee_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        Student::where('institution_id', $this->institutionId())->findOrFail($data['student_id']);

        $academicYearId = $data['academic_year_id'] ?? AcademicYear::where('institution_id', $this->institutionId())
            ->where('is_current', true)
            ->value('id');

        if (! $academicYearId) {
            return response()->json(['success' => false, 'message' => __('hostel.no_academic_year')], 422);
        }

        $existing = HostelAllocation::where('student_id', $data['student_id'])
            ->where('academic_year_id', $academicYearId)
            ->whereIn('status', ['allocated', 'active'])
            ->exists();

        if ($existing) {
            return response()->json(['success' => false, 'message' => __('hostel.allocation_exists')], 422);
        }

        if (! empty($data['registration_id'])) {
            $registration = HostelRegistration::where('institution_id', $this->institutionId())
                ->where('id', $data['registration_id'])
                ->where('status', 'approved')
                ->firstOrFail();
            $data['registration_id'] = $registration->id;
        }

        $allocation = $this->allocationService->allocate(array_merge($data, [
            'institution_id' => $this->institutionId(),
            'academic_year_id' => $academicYearId,
        ]));

        return response()->json(['success' => true, 'data' => $allocation], 201);
    }

    public function checkIn($id)
    {
        $allocation = HostelAllocation::where('institution_id', $this->institutionId())->findOrFail($id);
        $allocation = $this->allocationService->checkIn($allocation);

        return response()->json(['success' => true, 'data' => $allocation]);
    }

    public function release(Request $request, $id)
    {
        $allocation = HostelAllocation::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'check_out_date' => 'nullable|date',
        ]);

        $allocation = $this->allocationService->release($allocation, $data['check_out_date'] ?? null);

        return response()->json(['success' => true, 'data' => $allocation]);
    }
}
