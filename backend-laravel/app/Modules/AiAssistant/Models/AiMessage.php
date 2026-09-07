<?php

namespace App\Modules\AiAssistant\Models;

use Illuminate\Database\Eloquent\Model;

class AiMessage extends Model
{
    protected $table = 'ai_messages';

    protected $fillable = [
        'conversation_id', 'role', 'content', 'sources', 'actions', 'feedback',
    ];

    public function conversation()
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }

    public function sourcesArray()
    {
        $decoded = json_decode((string) $this->sources, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function actionsArray()
    {
        $decoded = json_decode((string) $this->actions, true);

        return is_array($decoded) ? $decoded : [];
    }
}
