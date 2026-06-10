<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgrammeRequiredDocument extends Model
{
    protected $fillable = [
        'programme_id',
        'name',
        'description',
        'is_required',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }
}
