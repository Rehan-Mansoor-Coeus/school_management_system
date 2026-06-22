<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\AdmissionLetterService;
use App\Modules\Admissions\Services\NotificationService;

class RegistrarController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:registrar|institution-admin|admin|super-admin|system-super-admin');
    }

    public function readyForAdmission()
    {
        $institutionId = $this->institutionId();

        $applications = Application::where('institution_id', $institutionId)
            ->where('status', 'department_approved')
            ->with(['applicant', 'programme'])
            ->orderByDesc('approved_at')
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

    public function admit($applicationId)
    {
        $application = Application::with(['applicant', 'programme', 'institution'])->findOrFail($applicationId);

        if (! $application->canAdmit()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.not_ready_admission'),
            ], 400);
        }

        $application->admit(auth()->id());

        $letterService = new AdmissionLetterService();
        $letterPath = $letterService->generateAdmissionLetter($application);

        $notificationService = new NotificationService();
        $notificationService->sendAdmissionLetter($application, $letterPath);
        $notificationService->sendApplicationStatusNotification($application, 'admitted');

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.admitted'),
            'data' => new ApplicationResource($application->fresh()),
        ]);
    }

    public function resendAdmissionLetter($applicationId)
    {
        try {
            $application = Application::with(['applicant', 'programme', 'institution', 'academicYear'])->findOrFail($applicationId);

            if ((int) $application->institution_id !== $this->institutionId()) {
                abort(403, $this->transForUser('admissions.unauthorized'));
            }

            if (! $application->canResendAdmissionLetter()) {
                return response()->json([
                    'success' => false,
                    'message' => $this->transForUser('admissions.letter_cannot_resend'),
                ], 400);
            }

            $letterPath = (new AdmissionLetterService())->generateAdmissionLetter($application);
            $delivery = (new NotificationService())->sendAdmissionLetter($application, $letterPath);

            $whatsappOk = (bool) ($delivery['whatsapp_document_sent'] ?? false);
            $message = $whatsappOk
                ? $this->transForUser('admissions.letter_resent')
                : ($delivery['error'] ?? 'Admission letter PDF generated and emailed. WhatsApp delivery was skipped or failed.');

            return response()->json([
                'success' => true,
                'message' => $message,
                'delivery' => $delivery,
                'data' => new ApplicationResource($application->fresh(['applicant', 'programme', 'academicYear'])),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Resend admission letter failed', [
                'application_id' => $applicationId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Could not generate admission letter: '.$e->getMessage(),
            ], 500);
        }
    }

    public function dashboard()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'ready_for_admission' => Application::where('institution_id', $institutionId)
                    ->where('status', 'department_approved')
                    ->count(),
                'admitted' => Application::where('institution_id', $institutionId)
                    ->where('status', 'admitted')
                    ->count(),
                'accepted' => Application::where('institution_id', $institutionId)
                    ->where('status', 'accepted')
                    ->count(),
                'enrolled' => Application::where('institution_id', $institutionId)
                    ->where('status', 'enrolled')
                    ->count(),
            ],
        ]);
    }
}
