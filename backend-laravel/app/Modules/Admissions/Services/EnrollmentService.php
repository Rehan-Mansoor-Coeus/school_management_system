<?php

namespace App\Modules\Admissions\Services;

use App\Institution;
use App\Modules\Admissions\Models\Application;
use App\Role;
use App\Services\UserAccountNotificationService;
use App\Student;
use App\User;
use Illuminate\Support\Str;

class EnrollmentService
{
    public function enrollFromApplication(Application $application, ?int $verifiedByUserId = null): array
    {
        $application->loadMissing(['applicant', 'programme', 'institution']);

        if ($application->status === 'enrolled') {
            $existing = Student::where('applicant_id', $application->applicant_id)->first();

            return ['student' => $existing ? $existing->load('user') : null, 'plain_password' => null];
        }

        if (! $application->tuition_fee_paid) {
            throw new \RuntimeException('Tuition must be paid before enrollment.');
        }

        $result = $this->createStudentFromApplication($application);
        $application->markTuitionVerified($verifiedByUserId);

        return $result;
    }

    public function createStudentFromApplication(Application $application): array
    {
        $applicant = $application->applicant;
        $existing = Student::where('applicant_id', $applicant->id)->first();
        if ($existing) {
            return ['student' => $existing->load('user'), 'plain_password' => null];
        }

        $plainPassword = null;
        $user = $applicant->user;
        if (! $user) {
            $plainPassword = UserAccountNotificationService::generateTemporaryPassword();
            $user = User::create([
                'institution_id' => $application->institution_id,
                'name' => $applicant->full_name,
                'email' => $applicant->email,
                'phone_number' => $applicant->phone,
                'username' => UserAccountNotificationService::generateUsername($applicant->full_name, $applicant->email),
                'password' => bcrypt($plainPassword),
                'api_token' => Str::random(60),
                'status' => 'active',
            ]);
            $applicant->update(['user_id' => $user->id]);
        }

        $studentRole = Role::where('name', 'student')->first();
        if ($studentRole && ! $user->hasRole('student')) {
            $user->assignRole($studentRole);
        }

        $student = Student::create([
            'institution_id' => $application->institution_id,
            'user_id' => $user->id,
            'applicant_id' => $applicant->id,
            'programme_id' => $application->programme_id,
            'registration_number' => $this->generateRegistrationNumber($application),
            'status' => 'active',
            'admission_date' => now(),
            'current_level' => 100,
            'is_active' => true,
        ]);

        try {
            app(\App\Modules\Licensing\Services\SemesterLicenseService::class)
                ->syncOpenSemestersForInstitution((int) $application->institution_id);
        } catch (\Throwable $e) {
            \Log::debug('licensing.enrollment_sync_skipped', ['error' => $e->getMessage()]);
        }

        return ['student' => $student->load('user'), 'plain_password' => $plainPassword];
    }

    public function generateRegistrationNumber(Application $application): string
    {
        $application->loadMissing(['applicant', 'programme.department.academicUnit', 'programme.academicUnit', 'institution']);

        $institution = $application->institution ?: Institution::find($application->institution_id);
        $programme = $application->programme;
        $department = optional($programme)->department;
        $academicUnit = optional($programme)->academicUnit ?: optional($department)->academicUnit;
        $applicant = $application->applicant;

        $institutionCode = $this->segmentCode(optional($institution)->code, 'INST');
        $unitCode = $this->academicUnitCode($academicUnit);
        $departmentCode = $this->segmentCode(optional($department)->code, 'DEPT');

        $idNumber = preg_replace('/\s+/', '', (string) optional($applicant)->id_number);
        $idSuffix = strtoupper(substr($idNumber, -5));
        if (strlen($idSuffix) < 5) {
            $idSuffix = str_pad($idSuffix, 5, '0', STR_PAD_LEFT);
        }

        $base = implode('/', [$institutionCode, $unitCode, $departmentCode, $idSuffix]);
        $candidate = $base;
        $counter = 1;

        while (Student::where('registration_number', $candidate)->exists()) {
            $candidate = $base.'-'.$counter;
            $counter++;
        }

        return $candidate;
    }

    protected function segmentCode(?string $value, string $fallback): string
    {
        $code = strtoupper(preg_replace('/[^A-Z0-9]/', '', (string) $value));

        return $code !== '' ? substr($code, 0, 12) : $fallback;
    }

    protected function academicUnitCode($unit): string
    {
        if (! $unit) {
            return 'UNIT';
        }

        $words = preg_split('/\s+/', trim((string) $unit->name));
        $initials = '';
        foreach ($words as $word) {
            if ($word !== '') {
                $initials .= strtoupper($word[0]);
            }
        }

        return $initials !== '' ? substr($initials, 0, 8) : 'UNIT';
    }
}
