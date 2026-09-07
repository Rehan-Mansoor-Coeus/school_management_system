<?php

namespace App\Modules\AiAssistant\Services;

class AiAssistantService
{
    /** @var OpenAiClient */
    protected $openai;
    /** @var AiKnowledgeService */
    protected $knowledge;
    /** @var AiToolRegistry */
    protected $tools;
    /** @var AiConversationService */
    protected $conversations;
    /** @var AiAuditService */
    protected $audit;
    /** @var AiAuthorizationService */
    protected $authorization;

    public function __construct(
        OpenAiClient $openai,
        AiKnowledgeService $knowledge,
        AiToolRegistry $tools,
        AiConversationService $conversations,
        AiAuditService $audit,
        AiAuthorizationService $authorization
    ) {
        $this->openai = $openai;
        $this->knowledge = $knowledge;
        $this->tools = $tools;
        $this->conversations = $conversations;
        $this->audit = $audit;
        $this->authorization = $authorization;
    }

    public function chat(AiRequestContext $ctx, $message, $conversationId = null, $visitorToken = null)
    {
        $message = trim((string) $message);
        $max = (int) config('ai.chat.max_message_length', 2000);
        if ($message === '' || mb_strlen($message) > $max) {
            return [
                'reply' => 'Please enter a question of reasonable length.',
                'conversation_id' => $conversationId,
                'sources' => [],
                'actions' => [],
                'escalate' => false,
                'status_label' => null,
            ];
        }

        $this->detectSecurity($ctx, $message);

        $conversation = $this->conversations->findOrCreate($ctx, $conversationId, $visitorToken);
        $this->conversations->addMessage($conversation, 'user', $message);

        $statusLabel = $ctx->isAuthenticated() ? 'Checking your Okusoma account…' : 'Searching Okusoma help…';
        $allowed = $this->authorization->allowedTools($ctx);
        $toolNames = array_map(function ($tool) {
            return $tool->name();
        }, $allowed);

        $payload = $this->openai->configured()
            ? $this->completeWithModel($ctx, $conversation, $message, $allowed)
            : $this->completeLocally($ctx, $message, $toolNames);

        $reply = $this->sanitizeReply(isset($payload['reply']) ? $payload['reply'] : '');
        $sources = isset($payload['sources']) ? $payload['sources'] : [];
        $actions = isset($payload['actions']) ? $payload['actions'] : [];
        $escalate = ! empty($payload['escalate']);

        $assistant = $this->conversations->addMessage($conversation, 'assistant', $reply, $sources, $actions);
        $this->conversations->maybeSummarize($conversation, $this->openai);

        return [
            'conversation_id' => $conversation->id,
            'message_id' => $assistant->id,
            'reply' => $reply,
            'sources' => $sources,
            'actions' => $actions,
            'escalate' => $escalate,
            'status_label' => $statusLabel,
            'suggestions' => $this->authorization->suggestions($ctx),
            'authenticated' => $ctx->isAuthenticated(),
            'role' => $ctx->roleSlug,
        ];
    }

    protected function completeWithModel(AiRequestContext $ctx, $conversation, $message, array $allowed)
    {
        $history = $this->conversations->history($conversation, (int) config('ai.chat.max_history', 8));
        $messages = [
            ['role' => 'system', 'content' => config('ai.system_prompt')],
            ['role' => 'system', 'content' => $this->runtimeContext($ctx, $allowed)],
        ];
        if ($conversation->summary) {
            $messages[] = ['role' => 'system', 'content' => 'Earlier conversation summary: '.$conversation->summary];
        }
        foreach ($history as $row) {
            if ($row->role === 'user' || $row->role === 'assistant') {
                $messages[] = ['role' => $row->role === 'assistant' ? 'assistant' : 'user', 'content' => $row->content];
            }
        }

        $schemas = array_map(function ($tool) {
            return $tool->schema();
        }, $allowed);

        $rounds = 0;
        $maxRounds = (int) config('ai.chat.max_tool_rounds', 3);
        $collectedSources = [];
        $collectedActions = [];
        $toolTouchedAccount = false;

        while ($rounds < $maxRounds) {
            $rounds++;
            $response = $this->openai->chat($messages, $schemas);
            $choice = isset($response['choices'][0]['message']) ? $response['choices'][0]['message'] : [];
            $toolCalls = isset($choice['tool_calls']) ? $choice['tool_calls'] : [];
            if (! $toolCalls) {
                $content = isset($choice['content']) ? $choice['content'] : '';
                $parsed = $this->parseModelContent($content);

                return [
                    'reply' => $parsed['reply'],
                    'sources' => $collectedSources ?: $parsed['sources'],
                    'actions' => $collectedActions ?: $parsed['actions'],
                    'escalate' => $parsed['escalate'],
                ];
            }

            $messages[] = $choice;
            foreach ($toolCalls as $call) {
                $name = data_get($call, 'function.name');
                $args = json_decode((string) data_get($call, 'function.arguments', '{}'), true);
                if (! is_array($args)) {
                    $args = [];
                }
                unset($args['institution_id'], $args['student_id'], $args['user_id']);
                $started = microtime(true);
                $tool = $this->tools->find($name, $ctx);
                if (! $tool) {
                    $this->audit->logSecurity('unauthorized_tool', $ctx, $name);
                    $result = ['error' => 'This tool is not available for your account.'];
                    $status = 'denied';
                } else {
                    if (in_array($name, ['student_balance', 'student_profile', 'student_results', 'finance_summary', 'institution_license'], true)) {
                        $toolTouchedAccount = true;
                    }
                    try {
                        $result = $tool->handle($args, $ctx);
                        $status = 'ok';
                    } catch (\Throwable $e) {
                        $result = ['error' => 'Unable to retrieve that information right now.'];
                        $status = 'error';
                    }
                    if (isset($result['articles'])) {
                        foreach ($result['articles'] as $article) {
                            if (! empty($article['source'])) {
                                $collectedSources[] = $article['source'];
                            }
                        }
                    }
                    if (isset($result['actions'])) {
                        $collectedActions = array_merge($collectedActions, $result['actions']);
                    }
                }
                $this->audit->logTool($conversation->id, null, (string) $name, $args, $status, (int) ((microtime(true) - $started) * 1000));
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => isset($call['id']) ? $call['id'] : uniqid('tool_'),
                    'content' => json_encode($this->audit->redact($result)),
                ];
            }
        }

        return [
            'reply' => $toolTouchedAccount
                ? 'I checked your Okusoma account but could not finish the answer. Please try again or open the matching page in Okusoma.'
                : 'I could not complete that answer from the official Okusoma knowledge base.',
            'sources' => $collectedSources,
            'actions' => $collectedActions,
            'escalate' => true,
        ];
    }

    protected function completeLocally(AiRequestContext $ctx, $message, array $toolNames)
    {
        $lower = strtolower($message);
        $sources = [];
        $actions = [];

        if (preg_match('/ignore (your )?previous|show me another school|database password|select \*|pretend i am an admin|run select/i', $message)) {
            $this->audit->logSecurity('injection', $ctx, $message);

            return [
                'reply' => 'I cannot change permissions or access another institution. Your access is decided by Okusoma, not by chat instructions.',
                'sources' => [],
                'actions' => [],
                'escalate' => false,
            ];
        }

        if (preg_match('/\b(my|our)\b.*(balance|results|timetable|license|students)|outstanding/i', $lower) && ! $ctx->isAuthenticated()) {
            return [
                'reply' => 'Sign in at /admin to see personal or school account information. I can still answer public questions about Okusoma, pricing, and registration.',
                'sources' => [],
                'actions' => [['label' => 'Sign in', 'href' => '/admin']],
                'escalate' => false,
            ];
        }

        if (preg_match('/password|forgot|reset pass/i', $lower)) {
            $info = app(AiDataAccessService::class)->passwordResetInstructions();
            $actions = $info['actions'];

            return [
                'reply' => "On the Okusoma login page, select Forgot Password, enter the email or WhatsApp number connected to your account, then enter the OTP sent to WhatsApp and set a new password.\n\n1. Open /admin\n2. Select Forgot Password\n3. Enter your account identifier\n4. Complete the WhatsApp OTP and choose a new password",
                'sources' => [['label' => 'Okusoma Help Center → Password reset', 'href' => '/admin', 'title' => 'Password reset']],
                'actions' => $actions,
                'escalate' => false,
            ];
        }

        if (preg_match('/price|cost|pricing|subscription|license fee|how much/i', $lower) && in_array('public_pricing', $toolNames, true)) {
            $pricing = app(AiDataAccessService::class)->publicPricing();
            $reply = 'Okusoma pricing is taken from the live license configuration. ';
            $reply .= 'The current per-student license fee is '.$pricing['per_student_license_fee'].' '.$pricing['currency'].' ('.$pricing['period'].').';
            if (! empty($pricing['plans'])) {
                $reply .= ' Active plans: '.implode(', ', array_map(function ($plan) {
                    return $plan['name'].' ('.$plan['currency'].' '.$plan['base_price'].')';
                }, $pricing['plans'])).'.';
            }

            return [
                'reply' => $reply,
                'sources' => [['label' => 'Okusoma Help Center → Pricing', 'href' => '/#pricing', 'title' => 'Pricing']],
                'actions' => [['label' => 'Request institution access', 'href' => '/request-institution']],
                'escalate' => false,
            ];
        }

        $articles = $this->knowledge->search($message, $ctx, 3);
        foreach ($articles as $article) {
            if (! empty($article['source'])) {
                $sources[] = $article['source'];
            }
        }
        if ($articles) {
            $first = $articles[0];

            return [
                'reply' => $first['content'],
                'sources' => $sources,
                'actions' => $this->defaultActions($first),
                'escalate' => false,
            ];
        }

        return [
            'reply' => 'I do not have a verified Okusoma article for that yet. You can browse Help after sign-in, request a school from /request-institution, or send the question to Alpha Bridge support.',
            'sources' => [],
            'actions' => [['label' => 'Contact support', 'href' => '/contact']],
            'escalate' => true,
        ];
    }

    protected function runtimeContext(AiRequestContext $ctx, array $allowed)
    {
        $names = array_map(function ($tool) {
            return $tool->name();
        }, $allowed);

        return 'Authenticated: '.($ctx->isAuthenticated() ? 'yes' : 'no')
            .'. Role: '.$ctx->roleSlug
            .'. Institution context: '.($ctx->institutionId ? 'yes' : 'no')
            .'. Available tools: '.implode(', ', $names)
            .'. Never invent a tool name. If a needed tool is missing, tell the user they lack permission or must sign in.';
    }

    protected function parseModelContent($content)
    {
        $content = trim((string) $content);
        $decoded = json_decode($content, true);
        if (is_array($decoded) && isset($decoded['reply'])) {
            return [
                'reply' => $decoded['reply'],
                'sources' => isset($decoded['sources']) ? $decoded['sources'] : [],
                'actions' => isset($decoded['actions']) ? $decoded['actions'] : [],
                'escalate' => ! empty($decoded['escalate']),
            ];
        }

        return [
            'reply' => $content,
            'sources' => [],
            'actions' => [],
            'escalate' => false,
        ];
    }

    protected function defaultActions(array $article)
    {
        $href = ! empty($article['source']['href']) ? $article['source']['href'] : '/help';

        return [['label' => 'Read Guide', 'href' => $href]];
    }

    protected function detectSecurity(AiRequestContext $ctx, $message)
    {
        $patterns = [
            'injection' => '/ignore (all )?(your |the )?previous|disregard (your )?instructions|you are now/i',
            'cross_tenant' => '/another school|other institution|institution (id )?28|cmu-africa|show me .+ from another/i',
            'secret_probe' => '/database password|\.env|api[_ ]key|select \s*\*|dump users|refresh token/i',
            'privilege' => '/pretend i am (an )?admin|act as super admin|grant me permission/i',
        ];
        foreach ($patterns as $type => $pattern) {
            if (preg_match($pattern, $message)) {
                $this->audit->logSecurity($type, $ctx, $message);
            }
        }
    }

    protected function sanitizeReply($reply)
    {
        $reply = (string) $reply;
        if ($this->audit->containsSecrets($reply)) {
            return 'I cannot share credentials, tokens, or internal secrets.';
        }

        return $this->audit->redactText($reply) === $reply || mb_strlen($reply) < 500
            ? $reply
            : $reply;
    }
}
