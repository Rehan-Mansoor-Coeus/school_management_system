<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\StudentReportService;
use Illuminate\Http\Request;

class StudentReportController extends Controller
{
    protected $reports;

    public function __construct(StudentReportService $reports)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:reports');
        $this->reports = $reports;
    }

    public function index(Request $request)
    {
        if (!$this->canView($request)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $rows = $this->reports->search(
            $this->institutionId($request),
            $request->get('q'),
            min(max((int) $request->get('limit', 25), 1), 100)
        );

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function show(Request $request, $studentId)
    {
        if (!$this->canView($request)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $report = $this->reports->build($this->institutionId($request), (int) $studentId);

        return response()->json(['success' => true, 'data' => $report]);
    }

    protected function canView(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        if ($user->hasRole('super-admin') || $user->hasRole('system-super-admin')) {
            return true;
        }

        return $user->hasAnyPermission(['reports.view', 'reports.students.view', 'reports.manage', 'admissions.manage', 'admissions.view']);
    }

    protected function institutionId(Request $request): int
    {
        return (int) (optional($request->user())->institution_id ?: 1);
    }
}
