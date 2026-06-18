<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterSetting extends Model
{
    protected $fillable = [
        'institution_id', 'company_name', 'letterhead_path', 'footer_path', 'logo_path',
        'default_signer_title', 'default_footer_text', 'serial_prefix', 'serial_counter',
    ];
}
