<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Letter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'category_id', 'template_id', 'reference', 'people_type', 'author_name',
        'subject', 'header_html', 'body_html', 'footer_html', 'status', 'comment', 'scheduled_at',
        'sent_at', 'created_by', 'updated_by', 'assigned_to', 'is_template', 'barcode_value', 'qr_code_value',
    ];

    protected $dates = ['scheduled_at', 'sent_at', 'deleted_at'];

    public function category()
    {
        return $this->belongsTo(LetterCategory::class, 'category_id');
    }

    public function template()
    {
        return $this->belongsTo(LetterTemplate::class, 'template_id');
    }

    public function recipients()
    {
        return $this->hasMany(LetterRecipient::class);
    }

    public function ccRecipients()
    {
        return $this->hasMany(LetterCcRecipient::class);
    }

    public function attachments()
    {
        return $this->hasMany(LetterAttachment::class);
    }

    public function comments()
    {
        return $this->hasMany(LetterComment::class);
    }

    public function approvals()
    {
        return $this->hasMany(LetterApproval::class);
    }

    public function histories()
    {
        return $this->hasMany(LetterStatusHistory::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
