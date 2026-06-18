<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AdmissionAgreement extends Model
{
    protected $fillable = [
        'institution_id',
        'programme_id',
        'title',
        'content',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForProgramme($query, int $institutionId, ?int $programmeId)
    {
        return $query->where('institution_id', $institutionId)
            ->active()
            ->where(function ($inner) use ($programmeId) {
                $inner->whereNull('programme_id');
                if ($programmeId) {
                    $inner->orWhere('programme_id', $programmeId);
                }
            });
    }
}
