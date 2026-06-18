<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class HostelBed extends Model
{
    protected $table = 'hostel_beds';

    protected $fillable = [
        'institution_id', 'room_id', 'bed_label', 'status',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function room()
    {
        return $this->belongsTo(HostelRoom::class, 'room_id');
    }

    public function allocation()
    {
        return $this->hasOne(HostelAllocation::class, 'bed_id')
            ->whereIn('status', ['allocated', 'active']);
    }
}
