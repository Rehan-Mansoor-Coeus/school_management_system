<?php

namespace App\Modules\AiAssistant\Tools;

use App\Modules\AiAssistant\Services\AiDataAccessService;
use App\Modules\AiAssistant\Services\AiKnowledgeService;
use App\Modules\AiAssistant\Services\AiRequestContext;
use App\Modules\AiAssistant\Tools\Contracts\AiTool;

abstract class BaseAiTool implements AiTool
{
    public function allowed($user = null)
    {
        return true;
    }

    protected function schemaFor($name, $description, array $properties = [], array $required = [])
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => $name,
                'description' => $description,
                'parameters' => [
                    'type' => 'object',
                    'properties' => $properties,
                    'required' => $required,
                ],
            ],
        ];
    }
}

class KnowledgeSearchTool extends BaseAiTool
{
    public function name()
    {
        return 'knowledge_search';
    }

    public function schema()
    {
        return $this->schemaFor('knowledge_search', 'Search official Okusoma help articles and manuals.', [
            'query' => ['type' => 'string', 'description' => 'Search query'],
        ], ['query']);
    }

    public function handle(array $args, AiRequestContext $ctx)
    {
        return ['articles' => app(AiKnowledgeService::class)->search(isset($args['query']) ? $args['query'] : '', $ctx)];
    }
}

class PublicPricingTool extends BaseAiTool
{
    public function name()
    {
        return 'public_pricing';
    }

    public function schema()
    {
        return $this->schemaFor('public_pricing', 'Get current Okusoma license and subscription prices from the database.');
    }

    public function handle(array $args, AiRequestContext $ctx)
    {
        return app(AiDataAccessService::class)->publicPricing();
    }
}

class PublicModulesTool extends BaseAiTool
{
    public function name()
    {
        return 'public_modules';
    }

    public function schema()
    {
        return $this->schemaFor('public_modules', 'List Okusoma modules available to institutions.');
    }

    public function handle(array $args, AiRequestContext $ctx)
    {
        return app(AiDataAccessService::class)->publicModules();
    }
}

class PasswordResetInstructionsTool extends BaseAiTool
{
    public function name()
    {
        return 'password_reset_instructions';
    }

    public function schema()
    {
        return $this->schemaFor('password_reset_instructions', 'Explain the official Okusoma password reset process. Never collect passwords.');
    }

    public function handle(array $args, AiRequestContext $ctx)
    {
        return app(AiDataAccessService::class)->passwordResetInstructions();
    }
}
