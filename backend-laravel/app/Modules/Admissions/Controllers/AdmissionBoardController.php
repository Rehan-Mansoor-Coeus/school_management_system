<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Requests\ReviewApplicationRequest;
use App\Modules\Admissions\Requests\ApproveApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\NotificationService;
use Illuminate\Http\Request;

class AdmissionBoardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:admission_board|admin');
    }

    /**
     * Get applications pending review
     */
    public function pendingReview(Request $request)
    {
        try {
            $institutionId = auth()->user()->institutions()->first()->id;

            $applications = Application::where('institution_id', $institutionId)
                ->where('status', 'submitted')
                ->with(['applicant', 'programme', 'academicYear'])
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Review application
     */
    public function review(ReviewApplicationRequest $request, $applicationId)
    {
        try {
            $application = Application::findOrFail($applicationId);

            if (!$application->canReview()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be reviewed at this stage.',
                ], 400);
            }

            $application->markAsReviewed(auth()->id(), $request->admission_comment);

            // Notify registrar
            $notificationService = new NotificationService();
            $notificationService->notifyRegistrar($application);

            return response()->json([
                'success' => true,
                'message' => 'Application reviewed successfully.',
                'data' => new ApplicationResource($application),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to review application.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve or reject application
     */
    public function decide(ApproveApplicationRequest $request, $applicationId)
    {
        try {
            $application = Application::findOrFail($applicationId);

            if (!$application->canApprove()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application is not ready for approval decision.',
                ], 400);
            }

            $notificationService = new NotificationService();

            if ($request->status === 'approved') {
                $application->approve(auth()->id());
                $notificationService->sendApplicationStatusNotification($application, 'approved');
                $notificationService->notifyFinanceOfficer($application);
                $message = 'Application approved successfully.';
            } else {
                $application->reject(auth()->id(), $request->rejection_reason);
                $notificationService->sendApplicationStatusNotification($application, 'rejected');
                $message = 'Application rejected.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => new ApplicationResource($application),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process application decision.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get application statistics dashboard
     */
    public function dashboard()
    {
        try {
            $institutionId = auth()->user()->institutions()->first()->id;

            $stats = [
                'total_applications' => Application::where('institution_id', $institutionId)->count(),
                'pending' => Application::where('institution_id', $institutionId)->where('status', 'submitted')->count(),
                'under_review' => Application::where('institution_id', $institutionId)->where('status', 'under_review')->count(),
                'approved' => Application::where('institution_id', $institutionId)->where('status', 'approved')->count(),
                'rejected' => Application::where('institution_id', $institutionId)->where('status', 'rejected')->count(),
                'admitted' => Application::where('institution_id', $institutionId)->where('status', 'admitted')->count(),
                'fee_paid' => Application::where('institution_id', $institutionId)->where('application_fee_paid', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data.',
            ], 500);
        }
    }
}
