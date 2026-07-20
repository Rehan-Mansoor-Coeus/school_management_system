<?php

namespace App\Services;

use App\AppNotification;
use App\Concerns\TranslatesForUser;
use App\Services\Messaging\MessageLogService;
use App\Services\Messaging\NotificationMessageFormatter;
use App\Services\Messaging\WhatsAppService;
use App\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserAccountNotificationService
{
    use TranslatesForUser;

    protected $whatsapp;

    protected $messageLogs;

    protected $formatter;

    public function __construct()
    {
        $this->whatsapp = new WhatsAppService();
        $this->messageLogs = new MessageLogService();
        $this->formatter = new NotificationMessageFormatter();
    }

    public function notifyAccountCreated(User $user, string $plainPassword, array $options = []): void
    {
        if (! $user->email) {
            return;
        }

        $category = $options['category'] ?? 'academic';
        $type = $options['type'] ?? 'success';
        $link = $options['link'] ?? null;
        $extraReplace = $options['replace'] ?? [];

        $username = $user->username ?: $user->email;
        $replace = array_merge([
            'name' => $user->name,
            'email' => $user->email,
            'username' => $username,
            'password' => $plainPassword,
        ], $extraReplace);

        $user->loadMissing('institution');
        $institutionName = optional($user->institution)->name;
        $title = $this->transForUser('notifications.account_created_title', [], $user);
        $inAppMessage = $this->formatter->format(
            $title,
            $this->formatter->greeting($user->name),
            [
                $this->formatter->field('Email', (string) $user->email),
                $this->formatter->field('Username', (string) $username),
                $this->formatter->field('Password', $plainPassword),
                $this->transForUser('notifications.account_created_hint', [], $user),
            ],
            $institutionName
        );
        $emailBody = $this->formatter->wrap(
            $this->transForUser('notifications.account_created_body', $replace, $user),
            $title,
            $institutionName
        );
        $subject = $this->transForUser('notifications.account_created_email_subject', [], $user);

        $notification = AppNotification::create([
            'user_id' => $user->id,
            'institution_id' => $user->institution_id,
            'title' => $title,
            'message' => $inAppMessage,
            'type' => $type,
            'category' => $category,
            'link' => $link,
            'is_read' => false,
        ]);

        $emailSent = $this->sendEmail($user->email, $subject, $emailBody);
        $whatsappSent = $this->sendWhatsApp($user, $replace);

        $notification->update([
            'is_sent_email' => $emailSent,
            'is_sent_whatsapp' => $whatsappSent,
        ]);
    }

    public function notifyEnrollmentWithAccount(User $user, string $plainPassword, string $registrationNumber): void
    {
        $user->loadMissing('institution');
        $institutionName = optional($user->institution)->name;
        $replace = [
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username ?: $user->email,
            'password' => $plainPassword,
            'reg' => $registrationNumber,
        ];

        $title = $this->transForUser('admissions.notify_header_enrolled', [], $user);
        $inAppMessage = $this->formatter->format(
            $title,
            $this->formatter->greeting($user->name),
            [
                $this->formatter->field(
                    $this->transForUser('admissions.notify_field_registration', [], $user),
                    $registrationNumber
                ),
                $this->formatter->field('Email', (string) $user->email),
                $this->formatter->field('Username', (string) $replace['username']),
                $this->formatter->field('Password', $plainPassword),
                $this->transForUser('admissions.notify_enrolled', ['reg' => $registrationNumber], $user),
            ],
            $institutionName
        );

        AppNotification::create([
            'user_id' => $user->id,
            'institution_id' => $user->institution_id,
            'title' => $title,
            'message' => $inAppMessage,
            'type' => 'success',
            'category' => 'admission',
            'is_read' => false,
        ]);

        $subject = $this->transForUser('notifications.account_created_email_subject', [], $user);
        $emailBody = $this->formatter->wrap(
            $this->transForUser('notifications.enrolled_with_account_body', $replace, $user),
            $title,
            $institutionName
        );
        $this->sendEmail($user->email, $subject, $emailBody);
        $this->sendWhatsApp($user, $replace, 'notifications.account_created_whatsapp');
    }

    public static function generateTemporaryPassword(): string
    {
        return 'Stu@'.Str::upper(Str::random(8));
    }

    public static function generateUsername(string $name, ?string $email = null): string
    {
        $base = Str::slug(str_replace('.', '-', $name), '.');
        if ($base === '') {
            $base = 'student';
        }

        $candidate = $base;
        $suffix = 1;
        while (User::where('username', $candidate)->exists()) {
            $candidate = $base.'.'.$suffix;
            $suffix++;
        }

        if (! $candidate && $email) {
            $candidate = Str::before($email, '@');
        }

        return $candidate;
    }

    protected function sendEmail(?string $email, string $subject, string $body): bool
    {
        if (! $email) {
            return false;
        }

        try {
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

            return true;
        } catch (\Exception $e) {
            Log::warning('Account notification email failed: '.$e->getMessage());

            return false;
        }
    }

    protected function sendWhatsApp(User $user, array $replace, string $messageKey = 'notifications.account_created_whatsapp'): bool
    {
        if (! $this->whatsapp->isConfigured()) {
            return false;
        }

        $phone = $this->whatsapp->normalizePhoneNumber((string) $user->phone_number);
        if (! $phone) {
            return false;
        }

        try {
            $user->loadMissing('institution');
            $message = $this->formatter->format(
                $this->transForUser('notifications.account_created_title', [], $user),
                $this->formatter->greeting($user->name),
                [
                    $this->formatter->field('Email', (string) ($replace['email'] ?? $user->email)),
                    $this->formatter->field('Username', (string) ($replace['username'] ?? '')),
                    $this->formatter->field('Password', (string) ($replace['password'] ?? '')),
                    $this->transForUser('notifications.account_created_hint', [], $user),
                ],
                optional($user->institution)->name
            );
            $result = $this->whatsapp->sendTextMessage($phone, $message, 'account_created');
            $this->messageLogs->logWhatsAppResult($user->institution_id, $result, [
                'recipient_name' => $user->name,
                'phone_number' => $phone,
                'message_type' => 'text',
                'module' => 'users',
                'related_id' => $user->id,
                'message' => $message,
            ]);

            return (bool) ($result['success'] ?? false);
        } catch (\Exception $e) {
            Log::warning('Account notification WhatsApp failed: '.$e->getMessage());

            return false;
        }
    }
}
