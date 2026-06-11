<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'institution',
        'question',
        'source',
        'status',
    ];
}
