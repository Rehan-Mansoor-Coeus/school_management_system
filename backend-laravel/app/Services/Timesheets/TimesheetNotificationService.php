<?php

namespace App\Services\Timesheets;

use App\Institution;
use App\Services\Messaging\NotificationMessageFormatter;
use App\TimesheetNotification;
use App\User;

class TimesheetNotificationService
{
    public function notify(User $user, $eventKey, array $replace = [], $payload = null, $channel = 'in_app')
    {
        $locale = $user->locale ?: 'en';
        $previous = app()->getLocale();
        app()->setLocale($locale);
        $title = __("timesheets.notifications.{$eventKey}.title", $replace);
        $body = __("timesheets.notifications.{$eventKey}.message", $replace);
        app()->setLocale($previous);

        $formatter = new NotificationMessageFormatter();
        $message = $formatter->wrap(
            $body,
            $title,
            optional(Institution::find($user->institution_id))->name
        );

        return TimesheetNotification::create([
            'institution_id' => $user->institution_id,
            'user_id' => $user->id,
            'channel' => $channel,
            'event_key' => $eventKey,
            'locale' => $locale,
            'title' => $title,
            'message' => $message,
            'payload' => $payload,
        ]);
    }
}
