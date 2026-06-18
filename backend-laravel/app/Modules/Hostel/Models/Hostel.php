<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hostel extends Model
{
    use SoftDeletes;

    protected $table = 'hostels';

    protected $fillable = [
        'institution_id', 'name', 'code', 'description', 'gender', 'location',
        'caretaker_phone', 'caretaker_email', 'total_rooms', 'total_capacity',
        'occupied_capacity', 'room_fee', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'room_fee' => 'decimal:2',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function rooms()
    {
        return $this->hasMany(HostelRoom::class, 'hostel_id');
    }
}
