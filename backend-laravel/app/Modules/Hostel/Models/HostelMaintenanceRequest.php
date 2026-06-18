<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class HostelMaintenanceRequest extends Model
{
    protected $table = 'hostel_maintenance_requests';

    protected $fillable = [
        'institution_id', 'hostel_id', 'room_id', 'bed_id', 'title', 'description',
        'priority', 'status', 'reported_by', 'assigned_to', 'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class, 'hostel_id');
    }

    public function room()
    {
        return $this->belongsTo(HostelRoom::class, 'room_id');
    }

    public function bed()
    {
        return $this->belongsTo(HostelBed::class, 'bed_id');
    }

    public function reporter()
    {
        return $this->belongsTo(\App\User::class, 'reported_by');
    }

    public function assignee()
    {
        return $this->belongsTo(\App\User::class, 'assigned_to');
    }
}
