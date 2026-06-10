<?php

namespace App\Library;

use Illuminate\Database\Eloquent\Model;

class LibrarySetting extends Model
{
    protected $table = 'library_settings';

    protected $fillable = [
        'institution_id', 'max_borrow_days', 'max_books_per_user', 'fine_per_day',
        'grace_period_days', 'allow_unlimited_borrowing', 'require_approval',
        'isbn_mandatory', 'author_mandatory', 'shelf_location_mandatory',
        'publisher_mandatory', 'publication_year_mandatory', 'default_reminder_days',
        'whatsapp_notifications_enabled', 'email_notifications_enabled',
        'block_borrow_on_unpaid_fines', 'librarian_user_ids',
    ];

    protected $casts = [
        'fine_per_day' => 'float',
        'max_borrow_days' => 'integer',
        'max_books_per_user' => 'integer',
        'grace_period_days' => 'integer',
        'default_reminder_days' => 'integer',
        'allow_unlimited_borrowing' => 'boolean',
        'require_approval' => 'boolean',
        'isbn_mandatory' => 'boolean',
        'author_mandatory' => 'boolean',
        'shelf_location_mandatory' => 'boolean',
        'publisher_mandatory' => 'boolean',
        'publication_year_mandatory' => 'boolean',
        'whatsapp_notifications_enabled' => 'boolean',
        'email_notifications_enabled' => 'boolean',
        'block_borrow_on_unpaid_fines' => 'boolean',
        'librarian_user_ids' => 'array',
    ];

    public static function defaults(int $institutionId): array
    {
        return [
            'institution_id' => $institutionId,
            'max_borrow_days' => 14,
            'max_books_per_user' => 3,
            'fine_per_day' => 0,
            'grace_period_days' => 0,
            'allow_unlimited_borrowing' => false,
            'require_approval' => true,
            'isbn_mandatory' => false,
            'author_mandatory' => false,
            'shelf_location_mandatory' => false,
            'publisher_mandatory' => false,
            'publication_year_mandatory' => false,
            'default_reminder_days' => 2,
            'whatsapp_notifications_enabled' => true,
            'email_notifications_enabled' => false,
            'block_borrow_on_unpaid_fines' => false,
            'librarian_user_ids' => [],
        ];
    }
}
