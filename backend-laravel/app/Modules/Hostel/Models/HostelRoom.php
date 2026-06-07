<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HostelRoom extends Model
{
    use SoftDeletes;

    protected $table = 'rooms';

    protected $fillable = [
        'institution_id', 'hostel_id', 'room_number', 'room_type', 'capacity',
        'occupied_beds', 'status', 'monthly_fee', 'facilities', 'floor_number',
    ];

    protected $casts = [
        'monthly_fee' => 'decimal:2',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class, 'hostel_id');
    }

    public function beds()
    {
        return $this->hasMany(HostelBed::class, 'room_id');
    }

    public function allocations()
    {
        return $this->hasMany(HostelAllocation::class, 'room_id');
    }
}
