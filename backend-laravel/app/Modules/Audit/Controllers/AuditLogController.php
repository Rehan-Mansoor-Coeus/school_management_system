<?php

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Concerns\ResolvesInstitution;
use App\Modules\Audit\Services\AuditActivityService;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use ResolvesInstitution;

    protected $activityService;

    public function __construct(AuditActivityService $activityService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:audit');
        $this->activityService = $activityService;
    }

    public function index(Request $request)
    {
        $data = $this->activityService->list($this->institutionId(), $request->all());

        return response()->json(['success' => true, 'data' => $data]);
    }
}
