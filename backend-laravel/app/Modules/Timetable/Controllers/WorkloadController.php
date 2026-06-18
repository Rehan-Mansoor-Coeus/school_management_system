<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Services\WorkloadService;
use Illuminate\Http\Request;

class WorkloadController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(WorkloadService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $data = $this->service->summary($this->institutionId(), $request->only(['teacher_id']));

        return response()->json(['success' => true, 'data' => $data]);
    }
}
