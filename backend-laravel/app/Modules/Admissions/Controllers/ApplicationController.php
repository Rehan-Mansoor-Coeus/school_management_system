<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Models\Applicant;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Requests\StoreApplicantRequest;
use App\Modules\Admissions\Requests\StoreApplicationRequest;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Models\AcademicYear;
use App\Models\Programme;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApplicationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Create new applicant account
     */
    public function createApplicant(StoreApplicantRequest $request)
    {
        try {
            $institutionId = auth()->user()->institutions()->first()->id ?? $request->institution_id;

            $applicant = Applicant::create([
                ...$request->validated(),
                'institution_id' => $institutionId,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Applicant profile created successfully.',
                'data' => $applicant,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create applicant profile.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit application
     */
    public function submitApplication(StoreApplicationRequest $request)
    {
        try {
            $applicant = Applicant::findOrFail($request->applicant_id);
            $institutionId = $applicant->institution_id;

            // Check if applicant already has an active application
            if ($applicant->hasActiveApplication()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active application.',
                ], 400);
            }

            // Get application fee from programme
            $programme = Programme::findOrFail($request->programme_id);
            $applicationFee = $programme->tuition_fee * 0.05; // 5% of tuition as application fee

            $application = Application::create([
                'institution_id' => $institutionId,
                'applicant_id' => $request->applicant_id,
                'academic_year_id' => $request->academic_year_id,
                'programme_id' => $request->programme_id,
                'application_number' => $this->generateApplicationNumber($institutionId),
                'status' => 'submitted',
                'application_fee' => $applicationFee,
            ]);

            // Notify admission board
            $notificationService = new \App\Modules\Admissions\Services\NotificationService();
            $notificationService->notifyAdmissionBoard($application);

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully.',
                'data' => new ApplicationResource($application),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit application.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get applicant's applications
     */
    public function getMyApplications()
    {
        try {
            $applicant = Applicant::where('user_id', auth()->id())->first();

            if (!$applicant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Applicant profile not found.',
                ], 404);
            }

            $applications = $applicant->applications()
                ->with(['academicYear', 'programme', 'reviewedBy', 'approvedBy', 'admittedBy'])
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single application
     */
    public function show($applicationId)
    {
        try {
            $application = Application::with([
                'applicant', 'academicYear', 'programme', 'reviewedBy', 'approvedBy', 'admittedBy'
            ])->findOrFail($applicationId);

            // Check authorization
            if ($application->applicant->user_id !== auth()->id()) {
                abort(403, 'Unauthorized');
            }

            return response()->json([
                'success' => true,
                'data' => new ApplicationResource($application),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found.',
            ], 404);
        }
    }

    /**
     * Generate unique application number
     */
    protected function generateApplicationNumber($institutionId)
    {
        $prefix = 'APP-' . date('Y');
        $count = Application::where('institution_id', $institutionId)
            ->whereYear('created_at', date('Y'))
            ->count() + 1;

        return $prefix . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
}
