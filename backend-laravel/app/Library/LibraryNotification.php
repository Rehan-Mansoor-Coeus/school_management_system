<?php

namespace App\Library;

use Illuminate\Database\Eloquent\Model;

class LibraryNotification extends Model
{
    protected $table = 'library_notifications';

    protected $fillable = [
        'institution_id', 'borrow_request_id', 'user_id', 'event', 'channel',
        'phone_number', 'message', 'status', 'error_message', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}
