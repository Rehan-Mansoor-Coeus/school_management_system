<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'title', 'header_html', 'body_html', 'footer_html', 'audience_type',
        'status', 'scheduled_at', 'sent_at', 'created_by', 'whatsapp_status',
    ];

    protected $dates = ['scheduled_at', 'sent_at', 'deleted_at'];

    public function recipients()
    {
        return $this->hasMany(AnnouncementRecipient::class);
    }

    public function attachments()
    {
        return $this->hasMany(AnnouncementAttachment::class);
    }

    public function schedules()
    {
        return $this->hasMany(AnnouncementSchedule::class);
    }
}
