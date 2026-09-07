<?php

namespace App\Modules\AiAssistant\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AiAssistant\Models\AiConversation;
use App\Modules\AiAssistant\Models\AiKnowledgeArticle;
use App\Modules\AiAssistant\Models\AiMessage;
use App\Modules\AiAssistant\Services\AiKnowledgeService;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AiKnowledgeController extends Controller
{
    /** @var AiKnowledgeService */
    protected $knowledge;

    public function __construct(AiKnowledgeService $knowledge)
    {
        $this->knowledge = $knowledge;
    }

    public function index(Request $request)
    {
        $this->authorizeManage($request);
        $query = AiKnowledgeArticle::query()->orderByDesc('updated_at');
        if ($request->filled('q')) {
            $like = '%'.$request->input('q').'%';
            $query->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)->orWhere('keywords', 'like', $like)->orWhere('content', 'like', $like);
            });
        }
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }
        if ($request->filled('audience')) {
            $query->where('audience', $request->input('audience'));
        }
        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->input('is_active'));
        }

        return response()->json([
            'data' => $query->paginate(20),
        ]);
    }

    public function show(Request $request, $id)
    {
        $this->authorizeManage($request);

        return response()->json(['data' => AiKnowledgeArticle::findOrFail($id)]);
    }

    public function store(Request $request)
    {
        $this->authorizeManage($request);
        $data = $this->validated($request);
        $article = $this->knowledge->upsertArticle($data, optional($request->user())->id);

        return response()->json(['data' => $article], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeManage($request);
        $data = $this->validated($request, false);
        $data['id'] = $id;
        $article = $this->knowledge->upsertArticle($data, optional($request->user())->id);

        return response()->json(['data' => $article]);
    }

    public function setStatus(Request $request, $id)
    {
        $this->authorizeManage($request);
        $article = AiKnowledgeArticle::findOrFail($id);
        $article->is_active = (bool) $request->input('is_active', true);
        $article->is_public = $request->has('is_public') ? (bool) $request->input('is_public') : $article->is_public;
        $article->updated_by = optional($request->user())->id;
        $article->save();

        return response()->json(['data' => $article]);
    }

    public function analytics(Request $request)
    {
        $this->authorizeManage($request);

        return response()->json([
            'articles' => AiKnowledgeArticle::count(),
            'published' => AiKnowledgeArticle::where('is_active', true)->count(),
            'conversations' => AiConversation::count(),
            'messages' => AiMessage::count(),
            'feedback_up' => AiMessage::where('feedback', 'up')->count(),
            'feedback_down' => AiMessage::where('feedback', 'down')->count(),
        ]);
    }

    protected function validated(Request $request, $creating = true)
    {
        $rules = [
            'title' => ($creating ? 'required' : 'sometimes').'|string|max:190',
            'slug' => 'nullable|string|max:190',
            'category' => 'nullable|string|max:64',
            'audience' => 'nullable|string|max:32',
            'content' => ($creating ? 'required' : 'sometimes').'|string',
            'keywords' => 'nullable|string',
            'source_type' => 'nullable|string|max:32',
            'source_reference' => 'nullable|string|max:190',
            'is_public' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'locale' => 'nullable|in:en,fr',
        ];
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            abort(response()->json(['errors' => $validator->errors()], 422));
        }

        return $validator->validated();
    }

    protected function authorizeManage(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }
        if (PlatformAccess::isPlatformSuperAdmin($user)) {
            return;
        }
        try {
            if ($user->hasPermissionTo('ai.knowledge.manage') || $user->can('ai.knowledge.manage')) {
                return;
            }
        } catch (\Throwable $e) {
        }
        abort(403, 'Forbidden');
    }
}
