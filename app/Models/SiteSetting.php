<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = [
        'company_name',
        'logo_path',
        'contact_email',
        'contact_phone',
        'address',
        'facebook_url',
        'twitter_url',
        'linkedin_url',
        'instagram_url',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
    ];

    public static function get()
    {
        return self::first() ?? new self();
    }
}
