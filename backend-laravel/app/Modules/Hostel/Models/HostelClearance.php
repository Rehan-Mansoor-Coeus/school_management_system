<?php

namespace App\Modules\Hostel\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class HostelClearance extends Model
{
    protected $table = 'hostel_clearances';

    protected $fillable = [
        'institution_id', 'allocation_id', 'room_inspected', 'items_returned',
        'fees_cleared', 'status', 'notes', 'cleared_by', 'cleared_at',
    ];

    protected $casts = [
        'room_inspected' => 'boolean',
        'items_returned' => 'boolean',
        'fees_cleared' => 'boolean',
        'cleared_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function allocation()
    {
        return $this->belongsTo(HostelAllocation::class, 'allocation_id');
    }

    public function clearedByUser()
    {
        return $this->belongsTo(\App\User::class, 'cleared_by');
    }
}
