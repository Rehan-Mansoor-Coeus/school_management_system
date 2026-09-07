<?php

namespace App\Modules\AiAssistant\Services;

use App\Modules\AiAssistant\Models\AiKnowledgeArticle;
use App\Modules\AiAssistant\Models\AiKnowledgeEmbedding;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AiKnowledgeService
{
    /** @var OpenAiClient */
    protected $openai;

    public function __construct(OpenAiClient $openai)
    {
        $this->openai = $openai;
    }

    public function search($query, AiRequestContext $ctx, $limit = 5)
    {
        $query = trim((string) $query);
        if ($query === '') {
            return [];
        }

        $builder = AiKnowledgeArticle::query()->active();
        if ($ctx->isAuthenticated() && $ctx->institutionId) {
            $builder->where(function ($q) use ($ctx) {
                $q->where('is_public', true)
                    ->orWhere('institution_id', $ctx->institutionId)
                    ->orWhereNull('institution_id');
            });
        } else {
            $builder->where('is_public', true)->whereIn('audience', ['public', 'all']);
        }

        $semantic = $this->semanticSearch($query, $builder->pluck('id')->all(), $limit);
        if ($semantic) {
            return $semantic;
        }

        return $this->keywordSearch($query, $builder, $limit);
    }

    public function findBySlug($slug)
    {
        return AiKnowledgeArticle::query()->active()->where('slug', $slug)->first();
    }

    public function upsertArticle(array $data, $userId = null)
    {
        $slug = isset($data['slug']) && $data['slug']
            ? Str::slug($data['slug'])
            : Str::slug($data['title']).'-'.Str::lower(Str::random(4));

        $article = null;
        if (! empty($data['id'])) {
            $article = AiKnowledgeArticle::find($data['id']);
        }
        if (! $article && ! empty($data['slug'])) {
            $article = AiKnowledgeArticle::where('slug', $slug)->first();
        }

        $payload = [
            'title' => $data['title'],
            'slug' => $slug,
            'category' => isset($data['category']) ? $data['category'] : 'faq',
            'audience' => isset($data['audience']) ? $data['audience'] : 'public',
            'content' => $data['content'],
            'keywords' => isset($data['keywords']) ? $data['keywords'] : null,
            'source_type' => isset($data['source_type']) ? $data['source_type'] : 'manual',
            'source_reference' => isset($data['source_reference']) ? $data['source_reference'] : null,
            'institution_id' => isset($data['institution_id']) ? $data['institution_id'] : null,
            'is_public' => array_key_exists('is_public', $data) ? (bool) $data['is_public'] : true,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            'locale' => isset($data['locale']) ? $data['locale'] : 'en',
            'updated_by' => $userId,
        ];

        if ($article) {
            $article->fill($payload);
            $article->save();
        } else {
            $payload['created_by'] = $userId;
            $article = AiKnowledgeArticle::create($payload);
        }

        $this->refreshSearchVector($article);

        return $article;
    }

    public function refreshSearchVector(AiKnowledgeArticle $article)
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }
        if (! Schema::hasColumn('ai_knowledge_articles', 'search_vector')) {
            return;
        }
        try {
            DB::update(
                'UPDATE ai_knowledge_articles SET search_vector = to_tsvector(\'simple\', coalesce(search_text, \'\')) WHERE id = ?',
                [$article->id]
            );
        } catch (\Throwable $e) {
        }
    }

    public function rebuildEmbeddings(AiKnowledgeArticle $article)
    {
        $chunks = $this->chunk($article->content);
        AiKnowledgeEmbedding::where('article_id', $article->id)->delete();
        if (! $chunks) {
            return 0;
        }

        $vectors = [];
        try {
            $vectors = $this->openai->embed($chunks);
        } catch (\Throwable $e) {
            $vectors = [];
        }

        foreach ($chunks as $index => $text) {
            AiKnowledgeEmbedding::create([
                'article_id' => $article->id,
                'chunk_index' => $index,
                'chunk_text' => $text,
                'embedding' => isset($vectors[$index]) ? json_encode($vectors[$index]) : null,
            ]);
        }

        return count($chunks);
    }

    protected function keywordSearch($query, $builder, $limit)
    {
        $terms = preg_split('/\s+/', Str::lower($query));
        $clone = clone $builder;

        if (Schema::getConnection()->getDriverName() === 'pgsql' && Schema::hasColumn('ai_knowledge_articles', 'search_vector')) {
            try {
                $rows = $clone->whereRaw(
                    "search_vector @@ plainto_tsquery('simple', ?)",
                    [$query]
                )->limit($limit)->get();
                if ($rows->isNotEmpty()) {
                    return $this->formatArticles($rows);
                }
            } catch (\Throwable $e) {
            }
        }

        $clone = clone $builder;
        $clone->where(function ($q) use ($query) {
            $like = '%'.$query.'%';
            $q->where('title', 'like', $like)
                ->orWhere('keywords', 'like', $like)
                ->orWhere('content', 'like', $like)
                ->orWhere('search_text', 'like', $like);
        });

        $rows = $clone->limit(20)->get();
        $scored = $rows->map(function (AiKnowledgeArticle $article) use ($terms) {
            $hay = Str::lower($article->title.' '.$article->keywords.' '.$article->content);
            $score = 0;
            foreach ($terms as $term) {
                if ($term === '') {
                    continue;
                }
                if (strpos(Str::lower($article->title), $term) !== false) {
                    $score += 5;
                }
                if (strpos($hay, $term) !== false) {
                    $score += 1;
                }
            }

            return ['article' => $article, 'score' => $score];
        })->sortByDesc('score')->take($limit)->values();

        return $this->formatArticles($scored->pluck('article'));
    }

    protected function semanticSearch($query, array $articleIds, $limit)
    {
        if (! $articleIds || ! $this->openai->configured()) {
            return [];
        }
        $chunks = AiKnowledgeEmbedding::query()
            ->whereIn('article_id', $articleIds)
            ->whereNotNull('embedding')
            ->with('article')
            ->get();
        if ($chunks->isEmpty()) {
            return [];
        }

        try {
            $vectors = $this->openai->embed([$query]);
        } catch (\Throwable $e) {
            return [];
        }
        $queryVector = isset($vectors[0]) ? $vectors[0] : [];
        if (! $queryVector) {
            return [];
        }

        $best = [];
        foreach ($chunks as $chunk) {
            $score = $this->cosine($queryVector, $chunk->vector());
            $articleId = $chunk->article_id;
            if (! isset($best[$articleId]) || $score > $best[$articleId]['score']) {
                $best[$articleId] = ['article' => $chunk->article, 'score' => $score];
            }
        }
        usort($best, function ($a, $b) {
            if ($a['score'] == $b['score']) {
                return 0;
            }

            return ($a['score'] > $b['score']) ? -1 : 1;
        });

        $articles = [];
        foreach (array_slice($best, 0, $limit) as $row) {
            if ($row['article']) {
                $articles[] = $row['article'];
            }
        }

        return $this->formatArticles($articles);
    }

    protected function formatArticles($articles)
    {
        $out = [];
        foreach ($articles as $article) {
            if (! $article) {
                continue;
            }
            $out[] = [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'category' => $article->category,
                'content' => mb_substr($article->content, 0, 1200),
                'source' => $article->toSourceArray(),
            ];
        }

        return $out;
    }

    protected function chunk($text, $size = 700)
    {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags((string) $text)));
        if ($text === '') {
            return [];
        }
        $chunks = [];
        $length = mb_strlen($text);
        for ($i = 0; $i < $length; $i += $size) {
            $chunks[] = mb_substr($text, $i, $size);
        }

        return $chunks;
    }

    protected function cosine(array $a, array $b)
    {
        if (! $a || ! $b || count($a) !== count($b)) {
            return 0.0;
        }
        $dot = 0.0;
        $na = 0.0;
        $nb = 0.0;
        $count = count($a);
        for ($i = 0; $i < $count; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }
        if ($na <= 0 || $nb <= 0) {
            return 0.0;
        }

        return $dot / (sqrt($na) * sqrt($nb));
    }
}
