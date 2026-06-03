<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Requests\ApproveApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\NotificationService;

class DepartmentReviewController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:hod|head-of-department|institution-admin|admin|super-admin');
    }

    public function pending()
    {
        $institutionId = $this->institutionId();
        $user = auth()->user();

        $query = Application::where('institution_id', $institutionId)
            ->where('status', 'registry_reviewed')
            ->with(['applicant', 'programme.department', 'academicYear']);

        if ($user->department_id) {
            $query->whereHas('programme', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        $applications = $query->orderByDesc('created_at')->paginate(15);

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

    public function decide(ApproveApplicationRequest $request, $applicationId)
    {
        $application = Application::with('programme')->findOrFail($applicationId);

        if (! $application->canDepartmentReview()) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.department_not_ready'),
            ], 400);
        }

        $user = auth()->user();
        if ($user->department_id && $application->programme->department_id !== (int) $user->department_id) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $notificationService = new NotificationService();

        if ($request->status === 'approved') {
            $application->markDepartmentApproved(auth()->id(), $request->admission_comment);
            $notificationService->notifyRegistrar($application);
            $message = $this->transForUser('admissions.department_approved');
        } else {
            $application->markDepartmentRejected(auth()->id(), $request->rejection_reason);
            $notificationService->sendApplicationStatusNotification($application, 'rejected');
            $message = $this->transForUser('admissions.department_rejected');
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => new ApplicationResource($application->fresh()),
        ]);
    }

    public function dashboard()
    {
        $institutionId = $this->institutionId();
        $user = auth()->user();

        $query = Application::where('institution_id', $institutionId);

        if ($user->department_id) {
            $query->whereHas('programme', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pending_review' => (clone $query)->where('status', 'registry_reviewed')->count(),
                'approved' => (clone $query)->where('status', 'department_approved')->count(),
                'rejected' => (clone $query)->where('status', 'rejected')->count(),
            ],
        ]);
    }
}
