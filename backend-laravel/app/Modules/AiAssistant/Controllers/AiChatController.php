<?php

namespace App\Modules\AiAssistant\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AiAssistant\Models\AiConversation;
use App\Modules\AiAssistant\Models\AiMessage;
use App\Modules\AiAssistant\Services\AiAssistantService;
use App\Modules\AiAssistant\Services\AiAuthorizationService;
use App\Modules\AiAssistant\Services\AiConversationService;
use App\Modules\AiAssistant\Services\AiRequestContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AiChatController extends Controller
{
    /** @var AiAssistantService */
    protected $assistant;
    /** @var AiConversationService */
    protected $conversations;
    /** @var AiAuthorizationService */
    protected $authorization;

    public function __construct(
        AiAssistantService $assistant,
        AiConversationService $conversations,
        AiAuthorizationService $authorization
    ) {
        $this->assistant = $assistant;
        $this->conversations = $conversations;
        $this->authorization = $authorization;
    }

    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|integer',
            'locale' => 'nullable|in:en,fr',
            'visitor_token' => 'nullable|string|max:80',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ctx = $this->context($request);
        $result = $this->assistant->chat(
            $ctx,
            $request->input('message'),
            $request->input('conversation_id'),
            $request->input('visitor_token')
        );

        return response()->json($result);
    }

    public function show(Request $request, $id)
    {
        $ctx = $this->context($request);
        $conversation = AiConversation::with('messages')->findOrFail($id);
        if (! $this->conversations->owns($conversation, $ctx, $request->input('visitor_token'))) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'id' => $conversation->id,
            'messages' => $conversation->messages->map(function (AiMessage $message) {
                return [
                    'id' => $message->id,
                    'role' => $message->role,
                    'content' => $message->content,
                    'sources' => $message->sourcesArray(),
                    'actions' => $message->actionsArray(),
                    'feedback' => $message->feedback,
                    'created_at' => $message->created_at ? $message->created_at->toIso8601String() : null,
                ];
            }),
        ]);
    }

    public function clear(Request $request, $id)
    {
        $ctx = $this->context($request);
        $conversation = AiConversation::findOrFail($id);
        $this->conversations->clear($conversation, $ctx, $request->input('visitor_token'));

        return response()->json(['cleared' => true, 'conversation_id' => $conversation->id]);
    }

    public function feedback(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|in:up,down',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $message = AiMessage::findOrFail($id);
        $conversation = $message->conversation;
        $ctx = $this->context($request);
        if (! $conversation || ! $this->conversations->owns($conversation, $ctx, $request->input('visitor_token'))) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $message->feedback = $request->input('rating');
        $message->save();

        return response()->json(['ok' => true]);
    }

    public function suggestions(Request $request)
    {
        $ctx = $this->context($request);

        return response()->json([
            'suggestions' => $this->authorization->suggestions($ctx),
            'authenticated' => $ctx->isAuthenticated(),
            'role' => $ctx->roleSlug,
        ]);
    }

    protected function context(Request $request)
    {
        $user = Auth::guard('api')->user();

        return new AiRequestContext($request, $user, $request->input('locale', 'en'));
    }
}
