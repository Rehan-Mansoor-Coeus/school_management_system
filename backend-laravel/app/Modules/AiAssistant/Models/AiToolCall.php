<?php

namespace App\Modules\AiAssistant\Models;

use Illuminate\Database\Eloquent\Model;

class AiToolCall extends Model
{
    protected $table = 'ai_tool_calls';

    protected $fillable = [
        'conversation_id', 'message_id', 'tool_name', 'arguments_json', 'status', 'duration_ms',
    ];
}
