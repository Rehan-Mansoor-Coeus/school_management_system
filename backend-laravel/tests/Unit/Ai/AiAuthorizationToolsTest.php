<?php

namespace Tests\Unit\Ai;

use App\Modules\AiAssistant\Services\AiRequestContext;
use App\Modules\AiAssistant\Services\AiToolRegistry;
use App\Modules\AiAssistant\Tools\FinanceSummaryTool;
use App\Modules\AiAssistant\Tools\StudentBalanceTool;
use Illuminate\Http\Request;
use Tests\TestCase;

class FakeAiUser
{
    public $roles = [];
    public $perms = [];

    public function hasRole($roles)
    {
        foreach ((array) $roles as $role) {
            if (in_array($role, $this->roles, true)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermissionTo($name)
    {
        return in_array($name, $this->perms, true);
    }

    public function can($name)
    {
        return $this->hasPermissionTo($name);
    }

    public function getPermissionNames()
    {
        return collect($this->perms);
    }

    public function getRoleNames()
    {
        return collect($this->roles);
    }
}

class AiAuthorizationToolsTest extends TestCase
{
    public function test_guest_only_gets_public_tools()
    {
        $ctx = new AiRequestContext(Request::create('/api/ai/chat', 'POST'), null);
        $names = $this->names($ctx);

        $this->assertContains('knowledge_search', $names);
        $this->assertContains('public_pricing', $names);
        $this->assertContains('password_reset_instructions', $names);
        $this->assertNotContains('student_balance', $names);
        $this->assertNotContains('finance_summary', $names);
    }

    public function test_teacher_cannot_use_finance_summary()
    {
        $teacher = new FakeAiUser();
        $teacher->roles = ['teacher'];
        $this->assertFalse((new FinanceSummaryTool())->allowed($teacher));
        $this->assertFalse((new StudentBalanceTool())->allowed($teacher));
    }

    public function test_student_can_use_balance_but_not_finance()
    {
        $student = new FakeAiUser();
        $student->roles = ['student'];
        $this->assertTrue((new StudentBalanceTool())->allowed($student));
        $this->assertFalse((new FinanceSummaryTool())->allowed($student));
    }

    public function test_finance_officer_can_use_finance_summary()
    {
        $officer = new FakeAiUser();
        $officer->roles = ['finance-officer'];
        $this->assertTrue((new FinanceSummaryTool())->allowed($officer));
    }

    protected function names(AiRequestContext $ctx)
    {
        return array_map(function ($tool) {
            return $tool->name();
        }, (new AiToolRegistry())->available($ctx));
    }
}
