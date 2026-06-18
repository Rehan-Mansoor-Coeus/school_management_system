<?php

namespace App\Services\Reports;

use App\CourseRegistration;
use App\Fee;
use App\Modules\Admissions\Models\Application;
use App\Result;
use App\Student;
use Illuminate\Support\Facades\DB;

class StudentReportService
{
    public function search(int $institutionId, ?string $query = null, int $limit = 25)
    {
        $builder = Student::query()
            ->with(['user:id,name,email,phone_number', 'programme:id,name,code'])
            ->where('institution_id', $institutionId);

        if ($query = trim((string) $query)) {
            $builder->where(function ($q) use ($query) {
                $q->where('registration_number', 'like', "%{$query}%")
                    ->orWhereHas('user', function ($userQuery) use ($query) {
                        $userQuery->where('name', 'like', "%{$query}%")
                            ->orWhere('email', 'like', "%{$query}%");
                    });
            });
        }

        return $builder->orderBy('registration_number')->limit($limit)->get();
    }

    public function build(int $institutionId, int $studentId): array
    {
        $student = Student::query()
            ->with([
                'user:id,name,email,phone_number',
                'programme:id,name,code,level',
                'institution:id,name,code',
            ])
            ->where('institution_id', $institutionId)
            ->findOrFail($studentId);

        $application = Application::query()
            ->with(['academicYear:id,name', 'programme:id,name,code'])
            ->where('institution_id', $institutionId)
            ->where('applicant_id', $student->applicant_id)
            ->orderByDesc('id')
            ->first();

        $fees = Fee::query()
            ->where('institution_id', $institutionId)
            ->where('student_id', $student->id)
            ->orderByDesc('id')
            ->get();

        $totalPaid = round((float) $fees->sum('amount_paid'), 2);
        $totalOwing = round((float) $fees->sum('balance'), 2);
        $totalBilled = round((float) $fees->sum('total_amount'), 2);

        $applicationPayments = DB::table('payments')
            ->where('institution_id', $institutionId)
            ->where(function ($q) use ($student, $application) {
                $q->where('student_id', $student->id);
                if ($application) {
                    $q->orWhere('application_id', $application->id);
                }
            })
            ->where('status', 'completed')
            ->sum('amount');

        $registrations = CourseRegistration::query()
            ->with(['subject:id,name,code', 'course:id,name,code', 'programmeSemester:id,semester_number,level_number'])
            ->where('institution_id', $institutionId)
            ->where('student_id', $student->id)
            ->orderByDesc('id')
            ->get();

        $results = Result::query()
            ->with(['course:id,name,code', 'semester:id,name'])
            ->where('institution_id', $institutionId)
            ->where('student_id', $student->id)
            ->orderByDesc('id')
            ->get();

        return [
            'student' => [
                'id' => $student->id,
                'registration_number' => $student->registration_number,
                'status' => $student->status,
                'admission_date' => optional($student->admission_date)->toDateString(),
                'current_level' => $student->current_level,
                'cumulative_gpa' => $student->cumulative_gpa,
                'name' => optional($student->user)->name,
                'email' => optional($student->user)->email,
                'phone' => optional($student->user)->phone_number,
                'programme' => $student->programme,
                'institution' => $student->institution,
            ],
            'application' => $application ? [
                'application_number' => $application->application_number,
                'status' => $application->status,
                'applied_at' => optional($application->created_at)->toDateTimeString(),
                'accepted_at' => optional($application->admission_accepted_at)->toDateTimeString(),
                'approved_at' => optional($application->approved_at)->toDateTimeString(),
                'admitted_at' => optional($application->admitted_at)->toDateTimeString(),
                'programme' => $application->programme,
                'academic_year' => $application->academicYear,
                'application_fee_paid' => (bool) $application->application_fee_paid,
                'fee_paid_at' => optional($application->fee_paid_at)->toDateTimeString(),
            ] : null,
            'fees' => [
                'total_billed' => $totalBilled,
                'total_paid' => $totalPaid,
                'total_owing' => $totalOwing,
                'application_payments' => round((float) $applicationPayments, 2),
                'invoices' => $fees,
            ],
            'registered_subjects' => $registrations->map(function ($row) {
                return [
                    'id' => $row->id,
                    'status' => $row->status,
                    'subject' => $row->subject,
                    'course' => $row->course,
                    'semester' => $row->programmeSemester,
                    'approved_at' => optional($row->approved_at)->toDateTimeString(),
                ];
            })->values(),
            'results' => $results->map(function ($row) {
                return [
                    'id' => $row->id,
                    'course' => $row->course,
                    'semester' => $row->semester,
                    'continuous_assessment' => $row->continuous_assessment,
                    'exam_score' => $row->exam_score,
                    'total_score' => $row->total_score,
                    'grade' => $row->grade,
                    'grade_point' => $row->grade_point,
                    'published_at' => optional($row->published_at)->toDateTimeString(),
                ];
            })->values(),
        ];
    }
}
