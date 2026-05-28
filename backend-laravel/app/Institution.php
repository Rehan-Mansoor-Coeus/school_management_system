<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Institution extends Model
{
    use SoftDeletes;

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'logo_url',
        'letterhead_url',
        'registrar_signature_url',
        'official_stamp_url',
    ];

    protected $fillable = [
        'name',
        'code',
        'type',
        'acronym',
        'description',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'country',
        'logo',
        'letterhead',
        'registrar_signature',
        'official_stamp',
        'currency',
        'timezone',
        'language',
        'mission',
        'vision',
        'is_active',
        'subscription_plan',
    ];

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'institution_modules')
            ->withPivot('enabled')
            ->withTimestamps();
    }

    public function settings()
    {
        return $this->hasOne(InstitutionSetting::class);
    }

    public function getLogoUrlAttribute()
    {
        return $this->publicFileUrl($this->logo);
    }

    public function getLetterheadUrlAttribute()
    {
        return $this->publicFileUrl($this->letterhead);
    }

    public function getRegistrarSignatureUrlAttribute()
    {
        return $this->publicFileUrl($this->registrar_signature);
    }

    public function getOfficialStampUrlAttribute()
    {
        return $this->publicFileUrl($this->official_stamp);
    }

    private function publicFileUrl($path)
    {
        if (! $path) {
            return null;
        }

        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return url(Storage::disk('public')->url($path));
    }
}
