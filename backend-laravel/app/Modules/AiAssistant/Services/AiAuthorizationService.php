<?php

namespace App\Modules\AiAssistant\Services;

use App\Support\PlatformAccess;

class AiAuthorizationService
{
    /** @var AiToolRegistry */
    protected $registry;

    public function __construct(AiToolRegistry $registry)
    {
        $this->registry = $registry;
    }

    public function allowedTools(AiRequestContext $ctx)
    {
        return $this->registry->available($ctx);
    }

    public function canUse(AiRequestContext $ctx, $toolName)
    {
        foreach ($this->allowedTools($ctx) as $tool) {
            if ($tool->name() === $toolName) {
                return true;
            }
        }

        return false;
    }

    public function suggestions(AiRequestContext $ctx)
    {
        if (! $ctx->isAuthenticated()) {
            return [
                'What is Okusoma?',
                'How much does Okusoma cost?',
                'How do I register my school?',
                'What modules are available?',
                'How do subscriptions work?',
                'How do I reset my password?',
            ];
        }

        if ($ctx->hasRole('student')) {
            return [
                'What classes do I have today?',
                'What is my current balance?',
                'Show my latest results.',
                'What is my application status?',
            ];
        }

        if ($ctx->hasRole('teacher')) {
            return [
                'What classes do I teach today?',
                'Show my timetable.',
                'What courses am I teaching?',
            ];
        }

        if ($ctx->hasRole(['finance-officer']) || $ctx->hasPermission(['fees.view', 'fees.manage'])) {
            return [
                'How much has been collected?',
                'Which students have outstanding balances?',
                'What is our license expiry date?',
            ];
        }

        if ($ctx->hasRole(['institution-admin', 'admin', 'super-admin', 'registrar']) || PlatformAccess::isPlatformSuperAdmin($ctx->user)) {
            return [
                'When does our Okusoma license expire?',
                'How many active students do we have?',
                'Which modules are enabled?',
                'What is our subscription status?',
            ];
        }

        return [
            'How do I reset my password?',
            'What modules are available?',
            'How do I use Admissions?',
        ];
    }
}
