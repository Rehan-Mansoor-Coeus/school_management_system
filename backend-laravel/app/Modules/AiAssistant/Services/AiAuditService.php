<?php

namespace App\Modules\AiAssistant\Services;

use App\Modules\AiAssistant\Models\AiSecurityEvent;
use App\Modules\AiAssistant\Models\AiToolCall;

class AiAuditService
{
    public function logTool($conversationId, $messageId, $toolName, array $args, $status, $durationMs = null)
    {
        AiToolCall::create([
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'tool_name' => $toolName,
            'arguments_json' => json_encode($this->redact($args)),
            'status' => $status,
            'duration_ms' => $durationMs,
        ]);
    }

    public function logSecurity($type, AiRequestContext $ctx, $snippet)
    {
        AiSecurityEvent::create([
            'event_type' => $type,
            'user_id' => $ctx->user ? $ctx->user->id : null,
            'institution_id' => $ctx->institutionId,
            'role_slug' => $ctx->roleSlug,
            'snippet' => $this->redactText((string) $snippet),
            'ip_address' => $ctx->request ? $ctx->request->ip() : null,
        ]);
    }

    public function redact($value)
    {
        if (is_array($value)) {
            $out = [];
            foreach ($value as $key => $item) {
                $lower = strtolower((string) $key);
                if (preg_match('/password|token|secret|api_key|authorization|hash|otp|credential/i', $lower)) {
                    $out[$key] = '[redacted]';
                    continue;
                }
                $out[$key] = $this->redact($item);
            }

            return $out;
        }

        return is_string($value) ? $this->redactText($value) : $value;
    }

    public function redactText($text)
    {
        $text = preg_replace('/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/', '[email]', $text);
        $text = preg_replace('/(password|api_token|token|secret|api_key|otp)\s*[:=]\s*\S+/i', '$1=[redacted]', $text);

        return mb_substr((string) $text, 0, 500);
    }

    public function containsSecrets($text)
    {
        return (bool) preg_match('/password_hash|api_token|OPENAI_API_KEY|DB_PASSWORD|APP_KEY|refresh_token|private_key/i', (string) $text);
    }
}
