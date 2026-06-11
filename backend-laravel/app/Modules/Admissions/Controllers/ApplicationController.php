<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Applicant;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationAgreementAcceptance;
use App\Modules\Admissions\Models\ApplicationDocument;
use App\Modules\Admissions\Requests\StoreApplicantRequest;
use App\Modules\Admissions\Requests\StoreApplicationRequest;
use App\Modules\Admissions\Requests\UpdateApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\AcademicYear;
use App\AdmissionAgreement;
use App\Programme;
use App\ProgrammeRequiredDocument;
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
        $this->storeApplicantSignature($application, $request);
        $this->storeAgreementAcceptances($application, $request);

        $application->load(['applicant', 'academicYear', 'programme', 'documents.programmeRequiredDocument', 'agreementAcceptances']);

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
            ->with(['applicant', 'academicYear', 'programme', 'registryReviewedBy', 'departmentReviewedBy', 'admittedBy', 'latestApplicationFeePayment', 'latestTuitionPayment', 'documents.programmeRequiredDocument'])
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
            'departmentReviewedBy', 'admittedBy', 'latestApplicationFeePayment', 'latestTuitionPayment',
            'documents.programmeRequiredDocument', 'agreementAcceptances',
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

    public function cancelApplication($applicationId)
    {
        $application = Application::with('applicant')->findOrFail($applicationId);

        if ((int) optional($application->applicant)->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        if (! $application->canCancelByStudent()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.cannot_cancel_application'),
            ], 400);
        }

        $application->markCancelled();

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.application_cancelled'),
            'data' => new ApplicationResource($application->fresh()),
        ]);
    }

    public function updateApplication(UpdateApplicationRequest $request, $applicationId)
    {
        $application = Application::with(['applicant', 'documents'])->findOrFail($applicationId);
        $applicant = $application->applicant;

        if ((int) optional($applicant)->user_id !== (int) auth()->id()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        if (! $application->canUpdateByStudent()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.cannot_update_application'),
            ], 400);
        }

        $programme = Programme::findOrFail($request->programme_id);
        $programmeChanged = (int) $application->programme_id !== (int) $programme->id;
        $applicationFee = $programme->application_fee > 0
            ? $programme->application_fee
            : max(5000, ($programme->tuition_fee ?? 0) * 0.05);

        $application->update([
            'academic_year_id' => $request->academic_year_id,
            'programme_id' => $programme->id,
            'application_fee' => $applicationFee,
            'tuition_fee' => $programme->tuition_fee ?? 0,
        ]);

        if ($programmeChanged) {
            $this->deleteApplicationDocuments($application);
        }

        $this->storeApplicantDocuments($applicant, $request);
        $this->deleteRequestedDocuments($application, $request);
        $this->syncApplicationDocumentsOnUpdate($application, $applicant, $request, $programmeChanged);
        $this->storeApplicantSignature($application, $request);

        if (\Illuminate\Support\Facades\Schema::hasTable('application_agreement_acceptances')) {
            $application->agreementAcceptances()->delete();
        }
        $this->storeAgreementAcceptances($application, $request);

        $application->load(['applicant', 'academicYear', 'programme', 'documents.programmeRequiredDocument', 'agreementAcceptances']);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.application_updated'),
            'data' => new ApplicationResource($application),
        ]);
    }

    public function referenceData()
    {
        $institutionId = $this->institutionId();

        $institutionAgreement = AdmissionAgreement::where('institution_id', $institutionId)
            ->whereNull('programme_id')
            ->active()
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'institution_agreement' => $institutionAgreement,
                'programmes' => Programme::where('institution_id', $institutionId)
                    ->where('is_active', true)
                    ->with(['department:id,name,code', 'requiredDocuments', 'admissionAgreement'])
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
        $folder = 'admissions/applications/'.$application->id.'/documents';

        $requiredIds = $request->input('required_document_ids', []);
        $requiredFiles = $request->file('required_documents', []);
        $comments = $request->input('document_comments', []);

        if (is_array($requiredFiles) && ! empty($requiredFiles)) {
            foreach ($requiredFiles as $index => $file) {
                if (! $file) {
                    continue;
                }

                $requiredDocId = is_array($requiredIds) && isset($requiredIds[$index])
                    ? (int) $requiredIds[$index]
                    : null;
                $requiredDoc = $requiredDocId
                    ? ProgrammeRequiredDocument::where('programme_id', $application->programme_id)
                        ->where('id', $requiredDocId)
                        ->first()
                    : null;

                $documentName = $requiredDoc
                    ? $requiredDoc->name
                    : 'Document '.($index + 1);

                $path = $file->store($folder, 'public');

                ApplicationDocument::create([
                    'institution_id' => $application->institution_id,
                    'application_id' => $application->id,
                    'applicant_id' => $applicant->id,
                    'programme_required_document_id' => $requiredDoc ? $requiredDoc->id : null,
                    'document_name' => $documentName,
                    'comment' => is_array($comments) && isset($comments[$index])
                        ? trim((string) $comments[$index]) ?: null
                        : null,
                    'file_path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'review_status' => 'pending',
                ]);
            }
        }

        $names = $request->input('document_names', []);
        $files = $request->file('documents', []);

        if (! is_array($files) || empty($files)) {
            return;
        }

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
                'review_status' => 'pending',
            ]);
        }
    }

    protected function syncApplicationDocumentsOnUpdate(
        Application $application,
        Applicant $applicant,
        Request $request,
        bool $programmeChanged
    ) {
        $requiredIds = $request->input('required_document_ids', []);
        $requiredFiles = $request->file('required_documents', []);
        $comments = $request->input('document_comments', []);

        if (! is_array($requiredFiles) || empty($requiredFiles)) {
            return;
        }

        $folder = 'admissions/applications/'.$application->id.'/documents';

        foreach ($requiredFiles as $index => $file) {
            if (! $file) {
                continue;
            }

            $requiredDocId = is_array($requiredIds) && isset($requiredIds[$index])
                ? (int) $requiredIds[$index]
                : null;

            if ($requiredDocId) {
                $existing = ApplicationDocument::where('application_id', $application->id)
                    ->where('programme_required_document_id', $requiredDocId)
                    ->get();

                foreach ($existing as $doc) {
                    if ($doc->file_path) {
                        Storage::disk('public')->delete($doc->file_path);
                    }
                    $doc->delete();
                }
            }

            $requiredDoc = $requiredDocId
                ? ProgrammeRequiredDocument::where('programme_id', $application->programme_id)
                    ->where('id', $requiredDocId)
                    ->first()
                : null;

            $path = $file->store($folder, 'public');

            ApplicationDocument::create([
                'institution_id' => $application->institution_id,
                'application_id' => $application->id,
                'applicant_id' => $applicant->id,
                'programme_required_document_id' => $requiredDoc ? $requiredDoc->id : null,
                'document_name' => $requiredDoc ? $requiredDoc->name : 'Document '.($index + 1),
                'comment' => is_array($comments) && isset($comments[$index])
                    ? trim((string) $comments[$index]) ?: null
                    : null,
                'file_path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'review_status' => 'pending',
            ]);
        }
    }

    protected function deleteRequestedDocuments(Application $application, Request $request): void
    {
        $deletedIds = $request->input('deleted_document_ids', []);
        if (! is_array($deletedIds) || empty($deletedIds)) {
            return;
        }

        foreach ($deletedIds as $documentId) {
            $document = ApplicationDocument::where('application_id', $application->id)
                ->where('id', (int) $documentId)
                ->first();

            if (! $document) {
                continue;
            }

            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();
        }
    }

    protected function deleteApplicationDocuments(Application $application): void
    {
        foreach ($application->documents as $document) {
            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }
            $document->delete();
        }
    }

    protected function storeApplicantSignature(Application $application, Request $request)
    {
        if (! $request->hasFile('applicant_signature')) {
            return;
        }

        $path = $request->file('applicant_signature')->store(
            'admissions/applications/'.$application->id,
            'public'
        );

        $application->update(['applicant_signature_path' => $path]);
    }

    protected function storeAgreementAcceptances(Application $application, Request $request)
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('application_agreement_acceptances')) {
            return;
        }

        $acceptedIds = $request->input('accepted_agreement_ids', []);
        if (! is_array($acceptedIds)) {
            return;
        }

        foreach ($acceptedIds as $agreementId) {
            $agreement = AdmissionAgreement::where('institution_id', $application->institution_id)
                ->active()
                ->where('id', (int) $agreementId)
                ->where(function ($query) use ($application) {
                    $query->whereNull('programme_id')
                        ->orWhere('programme_id', $application->programme_id);
                })
                ->first();

            if (! $agreement) {
                continue;
            }

            ApplicationAgreementAcceptance::create([
                'application_id' => $application->id,
                'admission_agreement_id' => $agreement->id,
                'accepted_at' => now(),
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
