<?php

namespace App\Modules\Hostel\Controllers;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use App\Modules\Hostel\Models\HostelRegistration;
use Illuminate\Http\Request;

class RegistrationController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index(Request $request)
    {
        $query = HostelRegistration::where('institution_id', $this->institutionId())
            ->with(['student.user', 'academicYear', 'preferredHostel', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['success' => true, 'data' => $query->latest()->paginate(20)]);
    }

    public function myRegistration()
    {
        $student = $this->studentForUser();
        if (! $student) {
            return response()->json(['success' => false, 'message' => __('hostel.not_a_student')], 403);
        }

        $registration = HostelRegistration::where('student_id', $student->id)
            ->with(['academicYear', 'preferredHostel', 'allocation.room.hostel', 'allocation.bed'])
            ->latest()
            ->first();

        return response()->json(['success' => true, 'data' => $registration]);
    }

    public function store(Request $request)
    {
        $student = $this->studentForUser();
        if (! $student) {
            return response()->json(['success' => false, 'message' => __('hostel.not_a_student')], 403);
        }

        $data = $request->validate([
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'preferred_hostel_id' => 'nullable|exists:hostels,id',
            'notes' => 'nullable|string',
        ]);

        $academicYearId = $data['academic_year_id'] ?? AcademicYear::where('institution_id', $this->institutionId())
            ->where('is_current', true)
            ->value('id');

        if (! $academicYearId) {
            return response()->json(['success' => false, 'message' => __('hostel.no_academic_year')], 422);
        }

        if (! empty($data['preferred_hostel_id'])) {
            Hostel::where('institution_id', $this->institutionId())->findOrFail($data['preferred_hostel_id']);
        }

        $existing = HostelRegistration::where('student_id', $student->id)
            ->where('academic_year_id', $academicYearId)
            ->first();

        if ($existing && ! in_array($existing->status, ['rejected'], true)) {
            return response()->json(['success' => false, 'message' => __('hostel.registration_exists')], 422);
        }

        $registration = HostelRegistration::create([
            'institution_id' => $this->institutionId(),
            'student_id' => $student->id,
            'academic_year_id' => $academicYearId,
            'preferred_hostel_id' => $data['preferred_hostel_id'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'data' => $registration->load(['academicYear', 'preferredHostel'])], 201);
    }

    public function review(Request $request, $id)
    {
        $registration = HostelRegistration::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($registration->status === 'allocated') {
            return response()->json(['success' => false, 'message' => __('hostel.registration_allocated')], 422);
        }

        $registration->update([
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $registration->notes,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $registration->fresh(['student.user', 'academicYear', 'preferredHostel'])]);
    }
}
