<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Applicant;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationDocument;
use App\Modules\Admissions\Requests\StoreApplicantRequest;
use App\Modules\Admissions\Requests\StoreApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\AcademicYear;
use App\Programme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

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
                'message' => $this->transForUser('admissions.applicant_exists'),
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
                'message' => $this->transForUser('admissions.validation_email_unique'),
                'errors' => [
                    'email' => [$this->transForUser('admissions.validation_email_unique')],
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
                    'message' => $this->transForUser('admissions.validation_id_number_unique'),
                    'errors' => [
                        'id_number' => [$this->transForUser('admissions.validation_id_number_unique')],
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
            'message' => $this->transForUser('admissions.applicant_created'),
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
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        if ($applicant->hasActiveApplication()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.active_application_exists'),
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
        $this->storeApplicationDocuments($application, $applicant, $request);

        $application->load(['applicant', 'academicYear', 'programme', 'documents']);

        (new \App\Modules\Admissions\Services\NotificationService())->notifyRegistry($application);
        (new \App\Modules\Admissions\Services\NotificationService())->sendApplicationStatusNotification($application, 'submitted');

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.application_submitted'),
            'data' => new ApplicationResource($application),
        ], 201);
    }

    public function getMyApplications()
    {
        $userId = auth()->id();

        $applications = Application::whereHas('applicant', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with(['applicant', 'academicYear', 'programme', 'registryReviewedBy', 'departmentReviewedBy', 'admittedBy', 'latestApplicationFeePayment', 'latestTuitionPayment', 'documents'])
            ->orderByDesc('created_at')
            ->paginate(10);

        $applications->getCollection()->each(function (Application $application) {
            $application->syncFeesFromProgramme();
        });

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
            'departmentReviewedBy', 'admittedBy', 'latestApplicationFeePayment', 'latestTuitionPayment', 'documents',
        ])->findOrFail($applicationId);

        if (! $this->userCanViewApplication($application)) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $application->syncFeesFromProgramme();

        return response()->json([
            'success' => true,
            'data' => new ApplicationResource($application),
        ]);
    }

    public function acceptAdmission($applicationId)
    {
        $application = Application::with('applicant')->findOrFail($applicationId);

        if ((int) $application->applicant->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        if (! $application->canAcceptAdmission()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.cannot_accept'),
            ], 400);
        }

        $application->markAdmissionAccepted();
        $application->load('programme');
        $application->syncFeesFromProgramme();
        $notificationService = new \App\Modules\Admissions\Services\NotificationService();
        $notificationService->sendApplicationStatusNotification($application, 'accepted');
        $notificationService->notifyFinanceOfficer($application);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.accepted'),
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

    protected function storeApplicationDocuments(Application $application, Applicant $applicant, Request $request)
    {
        $names = $request->input('document_names', []);
        $files = $request->file('documents', []);

        if (! is_array($files) || empty($files)) {
            return;
        }

        $folder = 'admissions/applications/'.$application->id.'/documents';

        foreach ($files as $index => $file) {
            if (! $file) {
                continue;
            }

            $documentName = is_array($names) && isset($names[$index]) && trim((string) $names[$index]) !== ''
                ? trim((string) $names[$index])
                : 'Document '.($index + 1);

            $path = $file->store($folder, 'public');

            ApplicationDocument::create([
                'institution_id' => $application->institution_id,
                'application_id' => $application->id,
                'applicant_id' => $applicant->id,
                'document_name' => $documentName,
                'file_path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }
    }

    protected function userCanViewApplication(Application $application): bool
    {
        $user = auth()->user();

        if ((int) optional($application->applicant)->user_id === (int) $user->id) {
            return true;
        }

        if (! $user->hasRole(['super-admin'])
            && (int) $application->institution_id !== (int) $user->institution_id) {
            return false;
        }

        if ($user->can('admissions.view') || $user->can('admissions.manage')) {
            return true;
        }

        $staffPermissions = [
            'admissions.registry.review',
            'admissions.department.review',
            'admissions.finance.verify',
            'admissions.registrar.admit',
            'admissions.hod.approve',
        ];

        foreach ($staffPermissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return $user->hasRole([
            'registry',
            'hod',
            'head-of-department',
            'registrar',
            'finance-officer',
            'admin',
            'institution-admin',
            'super-admin',
        ]);
    }
}
