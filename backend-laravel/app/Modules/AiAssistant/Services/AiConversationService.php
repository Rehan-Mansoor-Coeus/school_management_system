<?php

namespace App\Modules\AiAssistant\Services;

use App\Modules\AiAssistant\Models\AiConversation;
use App\Modules\AiAssistant\Models\AiMessage;

class AiConversationService
{
    public function findOrCreate(AiRequestContext $ctx, $conversationId = null, $visitorToken = null)
    {
        if ($conversationId) {
            $conversation = AiConversation::find($conversationId);
            if ($conversation && $this->owns($conversation, $ctx, $visitorToken)) {
                return $conversation;
            }
        }

        $latest = $this->latestOpen($ctx, $visitorToken);
        if ($latest) {
            return $latest;
        }

        return AiConversation::create([
            'user_id' => $ctx->user ? $ctx->user->id : null,
            'institution_id' => $ctx->institutionId,
            'role_slug' => $ctx->roleSlug,
            'locale' => $ctx->locale,
            'visitor_token_hash' => $ctx->user ? null : $this->hashVisitor($visitorToken),
        ]);
    }

    public function addMessage(AiConversation $conversation, $role, $content, array $sources = [], array $actions = [])
    {
        return AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => $role,
            'content' => $content,
            'sources' => $sources ? json_encode($sources) : null,
            'actions' => $actions ? json_encode($actions) : null,
        ]);
    }

    public function history(AiConversation $conversation, $limit = 8)
    {
        return $conversation->messages()->orderByDesc('id')->limit($limit)->get()->reverse()->values();
    }

    public function maybeSummarize(AiConversation $conversation, OpenAiClient $openai)
    {
        $count = $conversation->messages()->count();
        $threshold = (int) config('ai.chat.summarize_after', 12);
        if ($count < $threshold) {
            return;
        }

        $older = $conversation->messages()->orderBy('id')->limit($count - 6)->get();
        $text = $older->map(function (AiMessage $message) {
            return strtoupper($message->role).': '.$message->content;
        })->implode("\n");

        $summary = $conversation->summary;
        if ($openai->configured()) {
            try {
                $response = $openai->chat([
                    ['role' => 'system', 'content' => 'Summarize this Okusoma support chat in 80 words. Do not invent facts.'],
                    ['role' => 'user', 'content' => $text],
                ]);
                $summary = data_get($response, 'choices.0.message.content', $summary);
            } catch (\Throwable $e) {
            }
        }
        if (! $summary) {
            $summary = mb_substr($text, 0, 400);
        }
        $conversation->summary = $summary;
        $conversation->save();
    }

    public function clear(AiConversation $conversation, AiRequestContext $ctx, $visitorToken = null)
    {
        if (! $this->owns($conversation, $ctx, $visitorToken)) {
            abort(403, 'Forbidden');
        }
        $conversation->messages()->delete();
        $conversation->summary = null;
        $conversation->save();

        return $conversation;
    }

    public function owns(AiConversation $conversation, AiRequestContext $ctx, $visitorToken = null)
    {
        if ($ctx->user) {
            return (int) $conversation->user_id === (int) $ctx->user->id;
        }

        return $conversation->visitor_token_hash
            && hash_equals((string) $conversation->visitor_token_hash, (string) $this->hashVisitor($visitorToken));
    }

    protected function latestOpen(AiRequestContext $ctx, $visitorToken)
    {
        $query = AiConversation::query()->orderByDesc('id');
        if ($ctx->user) {
            return $query->where('user_id', $ctx->user->id)->first();
        }
        $hash = $this->hashVisitor($visitorToken);
        if (! $hash) {
            return null;
        }

        return $query->whereNull('user_id')->where('visitor_token_hash', $hash)->first();
    }

    protected function hashVisitor($token)
    {
        $token = trim((string) $token);
        if ($token === '') {
            return null;
        }

        return hash('sha256', $token);
    }
}
