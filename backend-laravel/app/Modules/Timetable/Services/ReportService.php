<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Models\TimetableEntry;

class ReportService
{
    protected $workloadService;
    protected $studentTimetableService;

    public const DAYS = [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday'];

    public function __construct(WorkloadService $workloadService, StudentTimetableService $studentTimetableService)
    {
        $this->workloadService = $workloadService;
        $this->studentTimetableService = $studentTimetableService;
    }

    /**
     * Build a normalized report payload: title, columns, rows.
     */
    public function build(int $institutionId, string $type, array $filters = []): array
    {
        switch ($type) {
            case 'contact_hours':
                return $this->contactHoursReport($institutionId, $filters);
            case 'workload':
                return $this->workloadReport($institutionId, $filters);
            case 'student':
                return $this->studentReport($institutionId, $filters);
            case 'teacher':
            case 'classroom':
            case 'department':
            case 'programme':
            default:
                return $this->timetableGridReport($institutionId, $type, $filters);
        }
    }

    protected function timetableGridReport(int $institutionId, string $type, array $filters): array
    {
        $query = TimetableEntry::query()
            ->with([
                'course:id,code,name',
                'teacher:id,name',
                'classroom:id,name,room_type',
                'department:id,name',
                'programme:id,name,code',
                'programmeSemester:id,name,semester_number',
            ])
            ->where('institution_id', $institutionId);

        foreach (['department_id', 'programme_id', 'programme_semester_id', 'teacher_id', 'classroom_id'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['academic_year'])) {
            $query->where('academic_year', $filters['academic_year']);
        }

        $entries = $query->orderBy('day_of_week')->orderBy('start_time')->get();

        $rows = $entries->map(fn ($e) => [
            'day' => self::DAYS[$e->day_of_week] ?? $e->day_of_week,
            'time' => substr((string) $e->start_time, 0, 5).' - '.substr((string) $e->end_time, 0, 5),
            'course' => trim((($e->course->code ?? '').' '.($e->course->name ?? ''))),
            'teacher' => $e->teacher->name ?? '-',
            'classroom' => $e->classroom->name ?? '-',
            'programme' => $e->programme->name ?? '-',
            'semester' => $e->programmeSemester->name ?? '-',
            'status' => $e->status,
        ])->values()->all();

        return [
            'type' => $type,
            'title' => ucfirst($type).' Timetable',
            'columns' => [
                ['key' => 'day', 'label' => 'Day'],
                ['key' => 'time', 'label' => 'Time'],
                ['key' => 'course', 'label' => 'Course'],
                ['key' => 'teacher', 'label' => 'Teacher'],
                ['key' => 'classroom', 'label' => 'Classroom'],
                ['key' => 'programme', 'label' => 'Programme'],
                ['key' => 'semester', 'label' => 'Semester'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function contactHoursReport(int $institutionId, array $filters): array
    {
        $query = CourseAssignment::query()
            ->with(['course:id,code,name,contact_hours', 'teacher:id,name'])
            ->where('institution_id', $institutionId);

        foreach (['course_id', 'teacher_id', 'programme_id', 'programme_semester_id'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        $rows = $query->get()->map(function ($a) {
            $expected = (int) $a->expected_contact_hours;
            $completed = (float) $a->completed_contact_hours;

            return [
                'course' => trim((($a->course->code ?? '').' '.($a->course->name ?? ''))),
                'teacher' => $a->teacher->name ?? '-',
                'required' => $expected,
                'completed' => $completed,
                'remaining' => max(0, round($expected - $completed, 2)),
            ];
        })->values()->all();

        return [
            'type' => 'contact_hours',
            'title' => 'Contact Hours Report',
            'columns' => [
                ['key' => 'course', 'label' => 'Course'],
                ['key' => 'teacher', 'label' => 'Teacher'],
                ['key' => 'required', 'label' => 'Required Hours'],
                ['key' => 'completed', 'label' => 'Completed'],
                ['key' => 'remaining', 'label' => 'Remaining'],
            ],
            'rows' => $rows,
        ];
    }

    protected function workloadReport(int $institutionId, array $filters): array
    {
        $rows = collect($this->workloadService->summary($institutionId, $filters))->map(fn ($w) => [
            'teacher' => $w['teacher_name'],
            'courses' => $w['course_count'],
            'expected' => $w['expected_hours'],
            'completed' => $w['completed_hours'],
            'remaining' => $w['remaining_hours'],
            'weekly' => $w['weekly_hours'],
            'max_weekly' => $w['max_weekly_hours'],
            'status' => $w['over_limit'] ? 'Over limit' : 'OK',
        ])->all();

        return [
            'type' => 'workload',
            'title' => 'Teacher Workload Report',
            'columns' => [
                ['key' => 'teacher', 'label' => 'Teacher'],
                ['key' => 'courses', 'label' => 'Courses'],
                ['key' => 'expected', 'label' => 'Expected Hrs'],
                ['key' => 'completed', 'label' => 'Completed'],
                ['key' => 'remaining', 'label' => 'Remaining'],
                ['key' => 'weekly', 'label' => 'Weekly Hrs'],
                ['key' => 'max_weekly', 'label' => 'Max Weekly'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    protected function studentReport(int $institutionId, array $filters): array
    {
        $data = ! empty($filters['student_id'])
            ? $this->studentTimetableService->forStudentId($institutionId, (int) $filters['student_id'], $filters)
            : ['entries' => collect()];

        $entries = collect($data['entries'] ?? []);
        $rows = $entries->map(fn ($e) => [
            'day' => self::DAYS[$e->day_of_week] ?? $e->day_of_week,
            'time' => substr((string) $e->start_time, 0, 5).' - '.substr((string) $e->end_time, 0, 5),
            'course' => trim((($e->course->code ?? '').' '.($e->course->name ?? ''))),
            'teacher' => $e->teacher->name ?? '-',
            'classroom' => $e->classroom->name ?? '-',
        ])->values()->all();

        return [
            'type' => 'student',
            'title' => 'Student Timetable',
            'columns' => [
                ['key' => 'day', 'label' => 'Day'],
                ['key' => 'time', 'label' => 'Time'],
                ['key' => 'course', 'label' => 'Course'],
                ['key' => 'teacher', 'label' => 'Teacher'],
                ['key' => 'classroom', 'label' => 'Classroom'],
            ],
            'rows' => $rows,
        ];
    }

    public function toCsv(array $report): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, array_map(fn ($c) => $c['label'], $report['columns']));
        foreach ($report['rows'] as $row) {
            $line = [];
            foreach ($report['columns'] as $col) {
                $line[] = $row[$col['key']] ?? '';
            }
            fputcsv($handle, $line);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    public function toPdf(array $report, ?string $institutionName = null): string
    {
        $html = '<html><head><meta charset="utf-8"><style>'
            .'body{font-family:DejaVu Sans, sans-serif;font-size:11px;color:#1f2937;}'
            .'h1{font-size:16px;margin:0 0 4px;}h2{font-size:12px;color:#6b7280;margin:0 0 12px;font-weight:normal;}'
            .'table{width:100%;border-collapse:collapse;}th,td{border:1px solid #d1d5db;padding:6px 8px;text-align:left;}'
            .'th{background:#f3f4f6;}'
            .'</style></head><body>';
        $html .= '<h1>'.e($report['title']).'</h1>';
        if ($institutionName) {
            $html .= '<h2>'.e($institutionName).' — generated '.now()->format('d M Y H:i').'</h2>';
        }
        $html .= '<table><thead><tr>';
        foreach ($report['columns'] as $col) {
            $html .= '<th>'.e($col['label']).'</th>';
        }
        $html .= '</tr></thead><tbody>';
        if (empty($report['rows'])) {
            $html .= '<tr><td colspan="'.count($report['columns']).'">No records found.</td></tr>';
        }
        foreach ($report['rows'] as $row) {
            $html .= '<tr>';
            foreach ($report['columns'] as $col) {
                $html .= '<td>'.e((string) ($row[$col['key']] ?? '')).'</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table></body></html>';

        $dompdf = new \Dompdf\Dompdf(['isRemoteEnabled' => false]);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }
}
