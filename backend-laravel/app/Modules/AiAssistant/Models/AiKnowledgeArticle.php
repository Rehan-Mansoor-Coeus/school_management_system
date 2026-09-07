<?php

namespace App\Modules\AiAssistant\Models;

use App\Institution;
use App\User;
use Illuminate\Database\Eloquent\Model;

class AiKnowledgeArticle extends Model
{
    protected $table = 'ai_knowledge_articles';

    protected $fillable = [
        'title', 'slug', 'category', 'audience', 'content', 'keywords',
        'source_type', 'source_reference', 'institution_id', 'is_public',
        'is_active', 'locale', 'search_text', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function (self $article) {
            $article->search_text = trim($article->title.' '.$article->keywords.' '.$article->content);
        });

        static::saved(function (self $article) {
            if (class_exists(\App\Modules\AiAssistant\Jobs\SyncKnowledgeEmbeddingJob::class)) {
                \App\Modules\AiAssistant\Jobs\SyncKnowledgeEmbeddingJob::dispatch($article->id);
            }
        });
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function embeddings()
    {
        return $this->hasMany(AiKnowledgeEmbedding::class, 'article_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function toSourceArray()
    {
        $label = $this->source_reference ?: $this->title;
        $href = null;
        if ($this->source_type === 'help') {
            $href = '/help';
        }

        return [
            'title' => $this->title,
            'category' => $this->category,
            'label' => 'Okusoma Help Center → '.$label,
            'href' => $href,
            'slug' => $this->slug,
        ];
    }
}
