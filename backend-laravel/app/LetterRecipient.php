<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterRecipient extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'recipient_type', 'recipient_id', 'name', 'email', 'phone',
        'address', 'personalized_body_html', 'placeholder_data', 'delivery_status',
    ];

    protected $casts = ['placeholder_data' => 'array'];
}
