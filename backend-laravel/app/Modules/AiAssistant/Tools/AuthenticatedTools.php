<?php

namespace App\Modules\AiAssistant\Tools;

use App\Modules\AiAssistant\Services\AiDataAccessService;
use App\Modules\AiAssistant\Services\AiRequestContext;
use App\Support\PlatformAccess;

class StudentProfileTool extends BaseAiTool
{
    public function name() { return 'student_profile'; }
    public function schema() { return $this->schemaFor('student_profile', 'Get the signed-in student profile.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->studentProfile($ctx); }
}

class StudentBalanceTool extends BaseAiTool
{
    public function name() { return 'student_balance'; }
    public function schema() { return $this->schemaFor('student_balance', 'Get the signed-in student outstanding fee balance.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->studentBalance($ctx); }
}

class StudentResultsTool extends BaseAiTool
{
    public function name() { return 'student_results'; }
    public function schema() { return $this->schemaFor('student_results', 'Get the signed-in student results summary.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->studentResults($ctx); }
}

class StudentCoursesTool extends BaseAiTool
{
    public function name() { return 'student_courses'; }
    public function schema() { return $this->schemaFor('student_courses', 'List courses registered by the signed-in student.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->studentCourses($ctx); }
}

class StudentTimetableTool extends BaseAiTool
{
    public function name() { return 'student_timetable'; }
    public function schema() { return $this->schemaFor('student_timetable', 'Get the signed-in student timetable.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->studentTimetable($ctx); }
}

class LibraryLoansTool extends BaseAiTool
{
    public function name() { return 'library_loans'; }
    public function schema() { return $this->schemaFor('library_loans', 'List books currently borrowed by the signed-in user.'); }
    public function allowed($user = null) { return $user && $user->hasRole(['student', 'teacher', 'staff']); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->libraryLoans($ctx); }
}

class ApplicationStatusTool extends BaseAiTool
{
    public function name() { return 'application_status'; }
    public function schema() { return $this->schemaFor('application_status', 'Get admission application status for the signed-in user.'); }
    public function allowed($user = null) { return $user && $user->hasRole('student'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->applicationStatus($ctx); }
}

class MyAnnouncementsTool extends BaseAiTool
{
    public function name() { return 'my_announcements'; }
    public function schema() { return $this->schemaFor('my_announcements', 'List recent announcements for the signed-in user institution.'); }
    public function allowed($user = null) { return (bool) $user; }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->myAnnouncements($ctx); }
}

class TeacherCoursesTool extends BaseAiTool
{
    public function name() { return 'teacher_courses'; }
    public function schema() { return $this->schemaFor('teacher_courses', 'List courses assigned to the signed-in teacher.'); }
    public function allowed($user = null) { return $user && $user->hasRole('teacher'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->teacherCourses($ctx); }
}

class TeacherTimetableTool extends BaseAiTool
{
    public function name() { return 'teacher_timetable'; }
    public function schema() { return $this->schemaFor('teacher_timetable', 'Get the signed-in teacher timetable.'); }
    public function allowed($user = null) { return $user && $user->hasRole('teacher'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->teacherTimetable($ctx); }
}

class TeacherEnrollmentCountTool extends BaseAiTool
{
    public function name() { return 'teacher_enrollment_count'; }
    public function schema() { return $this->schemaFor('teacher_enrollment_count', 'Count courses/students assigned to the signed-in teacher.'); }
    public function allowed($user = null) { return $user && $user->hasRole('teacher'); }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->teacherEnrollmentCount($ctx); }
}

class FinanceSummaryTool extends BaseAiTool
{
    public function name() { return 'finance_summary'; }
    public function schema() { return $this->schemaFor('finance_summary', 'Institution fee collection summary for authorized finance staff.'); }
    public function allowed($user = null)
    {
        return $user && ($user->hasRole('finance-officer') || $this->canFees($user));
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->financeSummary($ctx); }

    protected function canFees($user)
    {
        try {
            return $user->hasPermissionTo('fees.view') || $user->can('fees.manage');
        } catch (\Throwable $e) {
            return false;
        }
    }
}

class OutstandingFeesTool extends BaseAiTool
{
    public function name() { return 'outstanding_fees'; }
    public function schema() { return $this->schemaFor('outstanding_fees', 'List students with outstanding balances in the current institution.'); }
    public function allowed($user = null)
    {
        $tool = new FinanceSummaryTool();

        return $tool->allowed($user);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->outstandingFees($ctx); }
}

class InstitutionStudentCountTool extends BaseAiTool
{
    public function name() { return 'institution_student_count'; }
    public function schema() { return $this->schemaFor('institution_student_count', 'Count active students in the current institution.'); }
    public function allowed($user = null)
    {
        return $user && $user->hasRole(['institution-admin', 'admin', 'super-admin', 'registrar', 'system-super-admin']);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->institutionStudentCount($ctx); }
}

class InstitutionModulesTool extends BaseAiTool
{
    public function name() { return 'institution_modules'; }
    public function schema() { return $this->schemaFor('institution_modules', 'List modules enabled for the current institution.'); }
    public function allowed($user = null)
    {
        return $user && $user->hasRole(['institution-admin', 'admin', 'super-admin', 'system-super-admin']);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->institutionModules($ctx); }
}

class InstitutionLicenseTool extends BaseAiTool
{
    public function name() { return 'institution_license'; }
    public function schema() { return $this->schemaFor('institution_license', 'Get the current institution license status and expiry.'); }
    public function allowed($user = null)
    {
        return $user && $user->hasRole(['institution-admin', 'admin', 'super-admin', 'system-super-admin', 'finance-officer']);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->institutionLicense($ctx); }
}

class InstitutionSubscriptionTool extends BaseAiTool
{
    public function name() { return 'institution_subscription'; }
    public function schema() { return $this->schemaFor('institution_subscription', 'Get the current institution subscription status.'); }
    public function allowed($user = null)
    {
        $tool = new InstitutionLicenseTool();

        return $tool->allowed($user);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->institutionSubscription($ctx); }
}

class PlatformLicenseOverviewTool extends BaseAiTool
{
    public function name() { return 'platform_license_overview'; }
    public function schema() { return $this->schemaFor('platform_license_overview', 'Platform-wide license counts for Super Admin.'); }
    public function allowed($user = null)
    {
        return PlatformAccess::isPlatformSuperAdmin($user);
    }
    public function handle(array $args, AiRequestContext $ctx) { return app(AiDataAccessService::class)->platformLicenseOverview($ctx); }
}
