<?php

namespace App\Modules\AiAssistant\Models;

use App\User;
use Illuminate\Database\Eloquent\Model;

class AiConversation extends Model
{
    protected $table = 'ai_conversations';

    protected $fillable = [
        'user_id', 'institution_id', 'role_slug', 'locale', 'summary', 'visitor_token_hash',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(AiMessage::class, 'conversation_id')->orderBy('id');
    }
}
