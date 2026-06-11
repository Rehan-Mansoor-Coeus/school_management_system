<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Requests\ReviewApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\NotificationService;

class RegistryController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:registry|institution-admin|admin|super-admin|system-super-admin');
    }

    public function pending()
    {
        $institutionId = $this->institutionId();

        $applications = Application::where('institution_id', $institutionId)
            ->where('status', 'submitted')
            ->where('application_fee_paid', true)
            ->with(['applicant', 'programme', 'academicYear', 'documents.programmeRequiredDocument', 'documents.reviewedBy'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => ApplicationResource::collection($applications),
            'pagination' => [
                'total' => $applications->total(),
                'per_page' => $applications->perPage(),
                'current_page' => $applications->currentPage(),
            ],
        ]);
    }

    public function review(ReviewApplicationRequest $request, $applicationId)
    {
        $application = Application::findOrFail($applicationId);

        if (! $application->canRegistryReview()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.registry_not_ready'),
            ], 400);
        }

        if ($request->decision === 'rejected') {
            $application->markRegistryRejected(auth()->id(), $request->rejection_reason);
            (new NotificationService())->sendRejectionLetter($application, 'registry');

            return response()->json([
                'success' => true,
                'message' => $this->transForUser('admissions.registry_rejected'),
                'data' => new ApplicationResource($application->fresh(['documents.programmeRequiredDocument', 'documents.reviewedBy'])),
            ]);
        }

        $documentCheck = $this->validateDocumentsForApproval($application);
        if ($documentCheck !== true) {
            return response()->json([
                'success' => false,
                'message' => $documentCheck,
            ], 422);
        }

        $application->markRegistryReviewed(auth()->id(), $request->admission_comment);
        (new NotificationService())->sendApplicationStatusNotification($application, 'registry_reviewed');
        (new NotificationService())->notifyDepartment($application);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.registry_approved'),
            'data' => new ApplicationResource($application->fresh(['documents.programmeRequiredDocument', 'documents.reviewedBy'])),
        ]);
    }

    protected function validateDocumentsForApproval(Application $application)
    {
        $application->loadMissing(['documents.programmeRequiredDocument']);

        if ($application->documents->isEmpty()) {
            return true;
        }

        foreach ($application->documents as $document) {
            if ($document->isPendingReview()) {
                return $this->transForUser('admissions.documents_pending_review');
            }

            $isMandatory = optional($document->programmeRequiredDocument)->is_required;
            if ($isMandatory && $document->review_status === 'rejected') {
                return $this->transForUser('admissions.mandatory_document_rejected');
            }
        }

        return true;
    }

    public function dashboard()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'awaiting_review' => Application::where('institution_id', $institutionId)
                    ->where('status', 'submitted')
                    ->where('application_fee_paid', true)
                    ->count(),
                'registry_reviewed' => Application::where('institution_id', $institutionId)
                    ->where('status', 'registry_reviewed')
                    ->count(),
                'rejected' => Application::where('institution_id', $institutionId)
                    ->where('status', 'rejected')
                    ->count(),
            ],
        ]);
    }
}
