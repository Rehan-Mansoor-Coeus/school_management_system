<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AnnouncementSchedule extends Model
{
    protected $fillable = [
        'institution_id', 'announcement_id', 'scheduled_at', 'status', 'sent_at',
    ];

    protected $dates = ['scheduled_at', 'sent_at'];

    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}
