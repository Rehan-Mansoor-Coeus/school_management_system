<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterCategory extends Model
{
    protected $fillable = ['institution_id', 'name', 'description', 'is_active'];
}
