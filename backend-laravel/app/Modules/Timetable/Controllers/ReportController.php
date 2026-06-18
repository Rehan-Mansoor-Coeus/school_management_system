<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(ReportService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $type = $request->input('type', 'department');
        $format = $request->input('format', 'json');
        $filters = $request->only([
            'department_id', 'programme_id', 'programme_semester_id', 'teacher_id',
            'classroom_id', 'course_id', 'student_id', 'academic_year',
        ]);

        $report = $this->service->build($this->institutionId(), $type, $filters);

        if ($format === 'csv') {
            $csv = $this->service->toCsv($report);
            $filename = $this->filename($type, 'csv');

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]);
        }

        if ($format === 'pdf') {
            $institutionName = optional(Institution::find($this->institutionId()))->name;
            $pdf = $this->service->toPdf($report, $institutionName);
            $filename = $this->filename($type, 'pdf');

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]);
        }

        return response()->json(['success' => true, 'data' => $report]);
    }

    protected function filename(string $type, string $ext): string
    {
        return 'timetable-'.$type.'-report-'.now()->format('Ymd-His').'.'.$ext;
    }
}
