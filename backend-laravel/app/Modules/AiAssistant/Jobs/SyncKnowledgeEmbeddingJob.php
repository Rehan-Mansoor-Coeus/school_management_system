<?php

namespace App\Modules\AiAssistant\Jobs;

use App\Modules\AiAssistant\Models\AiKnowledgeArticle;
use App\Modules\AiAssistant\Services\AiKnowledgeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncKnowledgeEmbeddingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $articleId;

    public function __construct($articleId)
    {
        $this->articleId = $articleId;
    }

    public function handle(AiKnowledgeService $knowledge)
    {
        $article = AiKnowledgeArticle::find($this->articleId);
        if (! $article) {
            return;
        }
        $knowledge->refreshSearchVector($article);
        $knowledge->rebuildEmbeddings($article);
    }
}
