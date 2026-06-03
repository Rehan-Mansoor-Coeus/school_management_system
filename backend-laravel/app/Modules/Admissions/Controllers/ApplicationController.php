<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Modules\Admissions\Concerns\TranslatesAdmissions;
use App\Modules\Admissions\Models\Applicant;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Requests\StoreApplicantRequest;
use App\Modules\Admissions\Requests\StoreApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\AcademicYear;
use App\Programme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    use ResolvesInstitution, TranslatesAdmissions;

    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function createApplicant(Request $request)
    {
        $institutionId = $this->institutionId();
        $userId = auth()->id();

        $existing = Applicant::where('user_id', $userId)->first();
        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => $this->admissionsTrans('applicant_exists'),
                'data' => $existing,
            ]);
        }

        $input = $request->all();
        $input['middle_name'] = ! empty($input['middle_name']) ? $input['middle_name'] : null;
        $input['state'] = ! empty($input['state']) ? $input['state'] : null;
        $input['id_number'] = ! empty($input['id_number']) ? $input['id_number'] : null;
        $input['is_international'] = filter_var($input['is_international'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $validated = validator($input, StoreApplicantRequest::rulesFor(null), (new StoreApplicantRequest())->messages())
            ->validate();

        $emailTaken = Applicant::where('email', $validated['email'])
            ->where('user_id', '!=', $userId)
            ->exists();

        if ($emailTaken) {
            return response()->json([
                'success' => false,
                'message' => $this->admissionsTrans('validation_email_unique'),
                'errors' => [
                    'email' => [$this->admissionsTrans('validation_email_unique')],
                ],
            ], 422);
        }

        if (! empty($validated['id_number'])) {
            $idTaken = Applicant::where('id_number', $validated['id_number'])
                ->where('user_id', '!=', $userId)
                ->exists();

            if ($idTaken) {
                return response()->json([
                    'success' => false,
                    'message' => $this->admissionsTrans('validation_id_number_unique'),
                    'errors' => [
                        'id_number' => [$this->admissionsTrans('validation_id_number_unique')],
                    ],
                ], 422);
            }
        }

        $applicant = Applicant::create(array_merge($validated, [
            'institution_id' => $institutionId,
            'user_id' => $userId,
        ]));

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('applicant_created'),
            'data' => $applicant,
        ], 201);
    }

    public function myApplicant()
    {
        $applicant = Applicant::where('user_id', auth()->id())->first();

        return response()->json([
            'success' => true,
            'data' => $applicant,
        ]);
    }

    public function submitApplication(StoreApplicationRequest $request)
    {
        $applicant = Applicant::findOrFail($request->applicant_id);

        if ((int) $applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->admissionsTrans('unauthorized'));
        }

        if ($applicant->hasActiveApplication()) {
            return response()->json([
                'success' => false,
                'message' => $this->admissionsTrans('active_application_exists'),
            ], 400);
        }

        $programme = Programme::findOrFail($request->programme_id);
        $applicationFee = $programme->application_fee > 0
            ? $programme->application_fee
            : max(5000, ($programme->tuition_fee ?? 0) * 0.05);

        $application = Application::create([
            'institution_id' => $applicant->institution_id,
            'applicant_id' => $request->applicant_id,
            'academic_year_id' => $request->academic_year_id,
            'programme_id' => $request->programme_id,
            'application_number' => $this->generateApplicationNumber($applicant->institution_id),
            'status' => 'submitted',
            'application_fee' => $applicationFee,
            'tuition_fee' => $programme->tuition_fee ?? 0,
        ]);

        $this->storeApplicantDocuments($applicant, $request);

        $application->load(['applicant', 'academicYear', 'programme']);

        (new \App\Modules\Admissions\Services\NotificationService())->notifyRegistry($application);

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('application_submitted'),
            'data' => new ApplicationResource($application),
        ], 201);
    }

    public function getMyApplications()
    {
        $applicant = Applicant::where('user_id', auth()->id())->first();

        if (! $applicant) {
            return response()->json([
                'success' => true,
                'data' => [],
                'pagination' => ['total' => 0, 'per_page' => 10, 'current_page' => 1, 'last_page' => 1],
            ]);
        }

        $applications = $applicant->applications()
            ->with(['applicant', 'academicYear', 'programme', 'registryReviewedBy', 'departmentReviewedBy', 'admittedBy'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => ApplicationResource::collection($applications),
            'pagination' => [
                'total' => $applications->total(),
                'per_page' => $applications->perPage(),
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();

        $query = Application::where('institution_id', $institutionId)
            ->with(['applicant', 'academicYear', 'programme']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('application_number', 'like', $term)
                    ->orWhereHas('applicant', function ($applicantQuery) use ($term) {
                        $applicantQuery->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    });
            });
        }

        $applications = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ApplicationResource::collection($applications),
            'pagination' => [
                'total' => $applications->total(),
                'per_page' => $applications->perPage(),
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
            ],
        ]);
    }

    public function show($applicationId)
    {
        $application = Application::with([
            'applicant', 'academicYear', 'programme', 'registryReviewedBy',
            'departmentReviewedBy', 'admittedBy',
        ])->findOrFail($applicationId);

        if ((int) $application->applicant->user_id !== (int) auth()->id()
            && ! auth()->user()->can('admissions.view')
            && ! auth()->user()->can('admissions.manage')
            && ! auth()->user()->hasRole(['registry', 'hod', 'head-of-department', 'registrar', 'finance-officer', 'admin', 'institution-admin', 'super-admin'])) {
            abort(403, $this->admissionsTrans('unauthorized'));
        }

        return response()->json([
            'success' => true,
            'data' => new ApplicationResource($application),
        ]);
    }

    public function acceptAdmission($applicationId)
    {
        $application = Application::with('applicant')->findOrFail($applicationId);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->admissionsTrans('unauthorized'));
        }

        if (! $application->canAcceptAdmission()) {
            return response()->json([
                'success' => false,
                'message' => $this->admissionsTrans('cannot_accept'),
            ], 400);
        }

        $application->markAdmissionAccepted();
        (new \App\Modules\Admissions\Services\NotificationService())->notifyFinanceOfficer($application);

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('accepted'),
            'data' => new ApplicationResource($application->fresh()),
        ]);
    }

    public function referenceData()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'programmes' => Programme::where('institution_id', $institutionId)
                    ->where('is_active', true)
                    ->with('department:id,name,code')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code', 'department_id', 'tuition_fee', 'application_fee', 'level']),
                'academic_years' => AcademicYear::where('institution_id', $institutionId)
                    ->orderByDesc('is_current')
                    ->orderByDesc('start_year')
                    ->get(['id', 'name', 'code', 'is_current', 'start_year', 'end_year']),
            ],
        ]);
    }

    protected function generateApplicationNumber($institutionId)
    {
        $prefix = 'APP-'.date('Y');
        $count = Application::where('institution_id', $institutionId)
            ->whereYear('created_at', date('Y'))
            ->count() + 1;

        return $prefix.'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
    }

    protected function storeApplicantDocuments(Applicant $applicant, Request $request)
    {
        $updates = [];
        $folder = 'admissions/applicants/'.$applicant->id;

        if ($request->hasFile('passport_path')) {
            if ($applicant->passport_path) {
                Storage::disk('public')->delete($applicant->passport_path);
            }
            $updates['passport_path'] = $request->file('passport_path')->store($folder, 'public');
        }

        if ($request->hasFile('transcript_path')) {
            if ($applicant->transcript_path) {
                Storage::disk('public')->delete($applicant->transcript_path);
            }
            $updates['transcript_path'] = $request->file('transcript_path')->store($folder, 'public');
        }

        if ($updates) {
            $applicant->update($updates);
        }
    }
}
