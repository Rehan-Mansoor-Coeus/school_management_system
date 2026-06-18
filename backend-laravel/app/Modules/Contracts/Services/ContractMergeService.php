<?php

namespace App\Modules\Contracts\Services;

use App\Institution;
use App\Modules\Admissions\Models\Application;
use App\Modules\Hr\Models\HrStaffProfile;
use App\Programme;
use App\Student;
use App\User;

class ContractMergeService
{
    public function buildForUser(int $institutionId, string $recipientType, ?int $userId = null, ?int $studentId = null, ?int $hrStaffProfileId = null, array $overrides = []): array
    {
        $data = array_merge([
            'institution_name' => optional(Institution::find($institutionId))->name,
            'contract_date' => now()->toDateString(),
        ], $overrides);

        if ($studentId) {
            $data = array_merge($data, $this->fromStudent($institutionId, $studentId));
        }

        if ($userId) {
            $data = array_merge($data, $this->fromUser($institutionId, $userId));
        }

        if ($hrStaffProfileId) {
            $data = array_merge($data, $this->fromHrStaff($institutionId, $hrStaffProfileId));
        }

        if ($recipientType === 'student' && $userId && empty($studentId)) {
            $student = Student::where('institution_id', $institutionId)->where('user_id', $userId)->first();
            if ($student) {
                $data = array_merge($data, $this->fromStudent($institutionId, $student->id));
            }
        }

        return $data;
    }

    public function render(string $html, array $mergeData): string
    {
        $rendered = $html;
        foreach ($mergeData as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $rendered = str_replace(['{{'.$key.'}}', '{{ '. $key .' }}', '{'.$key.'}'], (string) $value, $rendered);
            }
        }

        return $rendered;
    }

    protected function fromUser(int $institutionId, int $userId): array
    {
        $user = User::where('institution_id', $institutionId)->find($userId);
        if (! $user) {
            return [];
        }

        return [
            'full_name' => $user->name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'employee_number' => $user->employee_number ?? $user->username,
        ];
    }

    protected function fromStudent(int $institutionId, int $studentId): array
    {
        $student = Student::with(['user', 'programme'])->where('institution_id', $institutionId)->find($studentId);
        if (! $student) {
            return [];
        }

        $application = Application::where('institution_id', $institutionId)
            ->where('applicant_id', $student->applicant_id)
            ->latest('id')
            ->first();

        $programme = $student->programme ?: ($application ? Programme::find($application->programme_id) : null);

        return [
            'full_name' => optional($student->user)->name,
            'student_number' => $student->registration_number,
            'email' => optional($student->user)->email,
            'phone_number' => optional($student->user)->phone_number,
            'programme' => optional($programme)->name,
            'department' => optional($programme)->department ?? '',
            'admission_date' => optional($student->admission_date)->toDateString(),
            'tuition_amount' => $application ? (string) $application->tuition_fee : '',
            'application_date' => optional(optional($application)->created_at)->toDateString(),
        ];
    }

    protected function fromHrStaff(int $institutionId, int $profileId): array
    {
        $staff = HrStaffProfile::where('institution_id', $institutionId)->find($profileId);
        if (! $staff) {
            return [];
        }

        return [
            'full_name' => trim($staff->first_name.' '.$staff->last_name),
            'employee_number' => $staff->staff_code,
            'email' => $staff->email,
            'phone_number' => $staff->phone,
            'position' => $staff->position,
            'department' => $staff->department,
            'job_title' => $staff->position,
            'fixed_salary' => (string) $staff->monthly_salary,
            'monthly_rate' => (string) $staff->monthly_salary,
            'daily_rate' => (string) $staff->daily_rate,
            'hourly_rate' => $staff->payment_type === 'hourly' ? (string) $staff->daily_rate : '',
            'contract_start_date' => optional($staff->contract_start)->toDateString(),
            'contract_end_date' => optional($staff->contract_end)->toDateString(),
            'bank_name' => $staff->bank_name,
            'bank_account' => $staff->bank_account,
        ];
    }
}
