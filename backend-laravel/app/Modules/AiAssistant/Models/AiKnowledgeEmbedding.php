<?php

namespace App\Modules\AiAssistant\Models;

use Illuminate\Database\Eloquent\Model;

class AiKnowledgeEmbedding extends Model
{
    protected $table = 'ai_knowledge_embeddings';

    protected $fillable = [
        'article_id', 'chunk_index', 'chunk_text', 'embedding',
    ];

    public function article()
    {
        return $this->belongsTo(AiKnowledgeArticle::class, 'article_id');
    }

    public function vector()
    {
        if (! $this->embedding) {
            return [];
        }
        $decoded = json_decode($this->embedding, true);

        return is_array($decoded) ? $decoded : [];
    }
}
