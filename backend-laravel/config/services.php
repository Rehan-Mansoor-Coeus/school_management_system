<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'phone_number' => env('TWILIO_PHONE_NUMBER'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
        'announcement_content_sid' => env('TWILIO_WHATSAPP_ANNOUNCEMENT_CONTENT_SID'),
    ],

    'wasender' => [
        'base_url' => env('WASENDER_BASE_URL', env('WASENDER_API_BASE_URL', 'https://wasenderapi.com')),
        'api_key' => env('WASENDER_API_KEY', env('WASENDER_API_TOKEN')),
        'token' => env('WASENDER_API_KEY', env('WASENDER_API_TOKEN')),
        'session_id' => env('WASENDER_SESSION_ID'),
    ],

];
