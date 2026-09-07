<?php

namespace App\Modules\AiAssistant\Services;

require_once __DIR__.'/../Tools/PublicTools.php';
require_once __DIR__.'/../Tools/AuthenticatedTools.php';

use App\Modules\AiAssistant\Tools\ApplicationStatusTool;
use App\Modules\AiAssistant\Tools\Contracts\AiTool;
use App\Modules\AiAssistant\Tools\FinanceSummaryTool;
use App\Modules\AiAssistant\Tools\InstitutionLicenseTool;
use App\Modules\AiAssistant\Tools\InstitutionModulesTool;
use App\Modules\AiAssistant\Tools\InstitutionStudentCountTool;
use App\Modules\AiAssistant\Tools\InstitutionSubscriptionTool;
use App\Modules\AiAssistant\Tools\KnowledgeSearchTool;
use App\Modules\AiAssistant\Tools\LibraryLoansTool;
use App\Modules\AiAssistant\Tools\MyAnnouncementsTool;
use App\Modules\AiAssistant\Tools\OutstandingFeesTool;
use App\Modules\AiAssistant\Tools\PasswordResetInstructionsTool;
use App\Modules\AiAssistant\Tools\PlatformLicenseOverviewTool;
use App\Modules\AiAssistant\Tools\PublicModulesTool;
use App\Modules\AiAssistant\Tools\PublicPricingTool;
use App\Modules\AiAssistant\Tools\StudentBalanceTool;
use App\Modules\AiAssistant\Tools\StudentCoursesTool;
use App\Modules\AiAssistant\Tools\StudentProfileTool;
use App\Modules\AiAssistant\Tools\StudentResultsTool;
use App\Modules\AiAssistant\Tools\StudentTimetableTool;
use App\Modules\AiAssistant\Tools\TeacherCoursesTool;
use App\Modules\AiAssistant\Tools\TeacherEnrollmentCountTool;
use App\Modules\AiAssistant\Tools\TeacherTimetableTool;

class AiToolRegistry
{
    /** @return AiTool[] */
    public function all()
    {
        return [
            new KnowledgeSearchTool(),
            new PublicPricingTool(),
            new PublicModulesTool(),
            new PasswordResetInstructionsTool(),
            new StudentProfileTool(),
            new StudentBalanceTool(),
            new StudentResultsTool(),
            new StudentCoursesTool(),
            new StudentTimetableTool(),
            new LibraryLoansTool(),
            new ApplicationStatusTool(),
            new MyAnnouncementsTool(),
            new TeacherCoursesTool(),
            new TeacherTimetableTool(),
            new TeacherEnrollmentCountTool(),
            new FinanceSummaryTool(),
            new OutstandingFeesTool(),
            new InstitutionStudentCountTool(),
            new InstitutionModulesTool(),
            new InstitutionLicenseTool(),
            new InstitutionSubscriptionTool(),
            new PlatformLicenseOverviewTool(),
        ];
    }

    /** @return AiTool[] */
    public function available(AiRequestContext $ctx)
    {
        $allowed = [];
        foreach ($this->all() as $tool) {
            if ($tool->allowed($ctx->user)) {
                $allowed[] = $tool;
            }
        }

        return $allowed;
    }

    public function find($name, AiRequestContext $ctx)
    {
        foreach ($this->available($ctx) as $tool) {
            if ($tool->name() === $name) {
                return $tool;
            }
        }

        return null;
    }

    public function schemas(AiRequestContext $ctx)
    {
        return array_map(function ($tool) {
            return $tool->schema();
        }, $this->available($ctx));
    }
}
