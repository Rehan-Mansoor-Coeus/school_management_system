<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class UserSignature extends Model
{
    protected $fillable = [
        'institution_id', 'user_id', 'signature_type', 'signature_path', 'is_active',
    ];
}
