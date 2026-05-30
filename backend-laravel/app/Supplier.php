<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'institution_id', 'name', 'email', 'phone_number', 'additional_phone_number', 'address', 'status',
    ];
}
