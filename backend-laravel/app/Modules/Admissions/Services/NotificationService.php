<?php

namespace App\Modules\Admissions\Services;

use App\AppNotification;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\User;
use App\Services\Messaging\MessageLogService;
use App\Services\Messaging\NotificationMessageFormatter;
use App\Services\Messaging\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class NotificationService
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

    public function sendAdmissionLetter(Application $application, $pdfPath)
    {
        $application->loadMissing(['applicant.user', 'programme', 'institution']);
        $user = optional($application->applicant)->user;
        $this->sendAdmissionEmail($application, $pdfPath);
        $whatsappResult = $this->sendAdmissionWhatsApp($application, $pdfPath);

        if ($application->applicant && $application->applicant->user_id) {
            $this->createInAppNotification(
                $application->applicant->user_id,
                $application->institution_id,
                $this->formatter->title(
                    $this->transPair('admissions.notify_admission_letter_title')['en'],
                    optional($application->institution)->name,
                    $this->transPair('admissions.notify_admission_letter_title')['fr']
                ),
                $this->formatBilingual(
                    'admissions.notify_admission_letter_title',
                    optional($application->applicant)->first_name ?: optional($user)->name,
                    [
                        $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                        $this->bilingualSummary('admissions.notify_admission_letter_body'),
                    ],
                    optional($application->institution)->name
                ),
                'admission'
            );
        }

        $application->markAdmissionLetterSent();

        return $whatsappResult;
    }

    public function sendRejectionLetter(Application $application, string $stage)
    {
        $application->loadMissing(['applicant.user', 'programme', 'institution']);
        $user = optional($application->applicant)->user;

        $letterPath = (new RejectionLetterService())->generateRejectionLetter($application, $stage);
        $stageLabel = $this->transForUser('admissions.rejection_stage_'.$stage, [], $user);

        $stageEn = $this->transPair('admissions.rejection_stage_'.$stage)['en'];
        $stageFr = $this->transPair('admissions.rejection_stage_'.$stage)['fr'];
        $headerPair = $this->transPair('admissions.rejection_notify_header');
        $header = $this->formatter->title($headerPair['en'], optional($application->institution)->name, $headerPair['fr']);
        $bodyPair = $this->transPair('admissions.rejection_notify_body', ['stage' => $stageEn]);
        $bodyFr = $this->transPair('admissions.rejection_notify_body', ['stage' => $stageFr])['fr'];
        $message = $this->formatBilingual(
            'admissions.rejection_notify_header',
            optional($application->applicant)->first_name ?: optional($user)->name,
            [
                $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                $this->bilingualField('admissions.notify_field_programme', optional($application->programme)->name ?: '—'),
                $this->formatter->summary($bodyPair['en'], $bodyFr),
            ],
            optional($application->institution)->name
        );

        $this->sendRejectionEmail($application, $letterPath, $stageLabel);
        $this->sendRejectionWhatsApp($application, $letterPath, $message);

        if ($application->applicant->user_id) {
            $this->createInAppNotification(
                $application->applicant->user_id,
                $application->institution_id,
                $header,
                $message,
                'admission'
            );
        }
    }

    protected function sendRejectionEmail(Application $application, string $pdfPath, string $stageLabel)
    {
        try {
            $applicant = $application->applicant;
            $user = $applicant->user;

            $subject = $this->transForUser('admissions.rejection_email_subject', [
                'number' => $application->application_number,
            ], $user);

            $body = $this->transForUser('admissions.rejection_email_body', [
                'name' => $applicant->first_name,
                'stage' => $stageLabel,
                'institution' => optional($application->institution)->name,
            ], $user);

            Mail::raw($body, function ($message) use ($applicant, $subject, $pdfPath) {
                $message->to($applicant->email)->subject($subject);
                if ($pdfPath && Storage::disk('public')->exists($pdfPath)) {
                    $message->attach(Storage::disk('public')->path($pdfPath));
                }
            });
        } catch (\Exception $e) {
            Log::warning('Rejection letter email failed: '.$e->getMessage());
        }
    }

    protected function sendRejectionWhatsApp(Application $application, string $pdfPath, string $message)
    {
        if (! $this->whatsapp->isConfigured()) {
            return;
        }

        try {
            $applicant = $application->applicant;
            $phone = $this->whatsapp->normalizePhoneNumber((string) $applicant->phone);
            if (! $phone) {
                return;
            }

            $this->whatsapp->sendTextMessage($phone, $message, 'rejection_letter');

            if ($pdfPath && Storage::disk('public')->exists($pdfPath)) {
                $publicUrl = Storage::disk('public')->url($pdfPath);
                $caption = $this->transForUser('admissions.rejection_whatsapp_caption', [
                    'number' => $application->application_number,
                ], optional($applicant)->user);
                $this->whatsapp->sendDocumentMessage($phone, $publicUrl, $caption, 'rejection_letter');
            }
        } catch (\Exception $e) {
            Log::warning('Rejection letter WhatsApp failed: '.$e->getMessage());
        }
    }

    protected function sendAdmissionEmail(Application $application, $pdfPath)
    {
        try {
            $applicant = $application->applicant;
            $institution = $application->institution;
            $user = $applicant->user;
            $locale = $this->userLocale($user);

            $subject = $this->transForUser('admissions.email_subject', [
                'number' => $application->application_number,
            ], $user);

            $body = $this->transForUser('admissions.email_admitted_body', [
                'name' => $applicant->first_name,
                'institution' => $institution->name,
                'programme' => $application->programme->name,
            ], $user);

            Mail::raw($body, function ($message) use ($applicant, $subject, $pdfPath, $locale) {
                $message->to($applicant->email)->subject($subject);
                if ($pdfPath && Storage::disk('public')->exists($pdfPath)) {
                    $message->attach(Storage::disk('public')->path($pdfPath));
                }
            });
        } catch (\Exception $e) {
            Log::warning('Admission letter email failed: '.$e->getMessage());
        }
    }

    protected function sendAdmissionWhatsApp(Application $application, $pdfPath)
    {
        $result = [
            'whatsapp_text_sent' => false,
            'whatsapp_document_sent' => false,
            'error' => null,
        ];

        if (! $this->whatsapp->isConfigured()) {
            $result['error'] = 'WhatsApp API is not configured.';
            Log::warning('Admission letter WhatsApp skipped: WASENDER_API_KEY not configured.');

            return $result;
        }

        try {
            $application->loadMissing(['applicant.user', 'institution', 'programme']);
            $applicant = $application->applicant;
            $user = $applicant->user;
            $normalizedPhone = $this->whatsapp->normalizePhoneNumber((string) $applicant->phone);

            if (! $normalizedPhone) {
                $result['error'] = 'Invalid or missing applicant phone number.';
                Log::warning('Admission letter WhatsApp skipped: invalid phone', [
                    'application_id' => $application->id,
                    'phone' => $applicant->phone,
                ]);

                return $result;
            }

            $message = $this->formatBilingual(
                'admissions.notify_header_admitted',
                $applicant->first_name,
                [
                    $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                    $this->bilingualField('admissions.notify_field_programme', $application->programme->name),
                    $this->bilingualSummary('admissions.whatsapp_admitted_body'),
                ],
                optional($application->institution)->name
            );

            $textResult = $this->whatsapp->sendTextMessage($normalizedPhone, $message, 'admission_letter');
            $this->messageLogs->logWhatsAppResult($application->institution_id, $textResult, [
                'recipient_name' => $applicant->full_name,
                'phone_number' => $normalizedPhone,
                'message_type' => 'text',
                'module' => 'admission',
                'related_id' => $application->id,
                'message' => $message,
            ]);
            $result['whatsapp_text_sent'] = (bool) ($textResult['success'] ?? false);

            if (! $pdfPath || ! Storage::disk('public')->exists($pdfPath)) {
                $result['error'] = 'Admission letter PDF file not found.';
                Log::warning('Admission letter WhatsApp PDF missing', [
                    'application_id' => $application->id,
                    'path' => $pdfPath,
                ]);

                return $result;
            }

            // Wasender needs a short pause between consecutive messages (same as Letters module).
            sleep(6);

            $upload = $this->whatsapp->uploadLocalFile($pdfPath, 'application/pdf');
            if (! ($upload['success'] ?? false) || empty($upload['public_url'])) {
                $result['error'] = $upload['error'] ?? 'Unable to upload admission letter PDF to WhatsApp.';
                Log::warning('Admission letter WhatsApp upload failed', [
                    'application_id' => $application->id,
                    'error' => $result['error'],
                ]);

                return $result;
            }

            $documentUrl = $upload['public_url'];
            $fileName = $application->application_number.'-Admission-Letter.pdf';
            $caption = $this->transForUser('admissions.whatsapp_letter_caption', [
                'number' => $application->application_number,
            ], $user);

            $docResult = $this->whatsapp->sendDocumentMessage(
                $normalizedPhone,
                $documentUrl,
                $caption,
                $fileName
            );

            $this->messageLogs->logWhatsAppResult($application->institution_id, $docResult, [
                'recipient_name' => $applicant->full_name,
                'phone_number' => $normalizedPhone,
                'message_type' => 'document',
                'module' => 'admission',
                'related_id' => $application->id,
                'message' => $caption,
                'attachment_url' => $documentUrl,
            ]);

            $result['whatsapp_document_sent'] = (bool) ($docResult['success'] ?? false);
            if (! $result['whatsapp_document_sent']) {
                $result['error'] = $docResult['error'] ?? 'WhatsApp document send failed.';
                Log::warning('Admission letter WhatsApp document failed', [
                    'application_id' => $application->id,
                    'error' => $result['error'],
                ]);
            }
        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            Log::warning('Admission letter WhatsApp failed: '.$e->getMessage());
        }

        return $result;
    }

    public function sendApplicationStatusNotification(Application $application, $status, array $replace = [])
    {
        $keys = [
            'submitted' => 'notify_submitted',
            'application_fee_paid' => 'notify_application_fee_paid',
            'application_fee_proof_submitted' => 'notify_application_fee_proof_submitted',
            'application_fee_proof_rejected' => 'notify_application_fee_proof_rejected',
            'registry_reviewed' => 'notify_registry_reviewed',
            'approved' => 'notify_approved',
            'rejected' => 'notify_rejected',
            'admitted' => 'notify_admitted',
            'accepted' => 'notify_accepted',
            'tuition_paid' => 'notify_tuition_paid',
            'enrolled' => 'notify_enrolled',
        ];

        $headerKeys = [
            'submitted' => 'notify_header_submitted',
            'application_fee_paid' => 'notify_header_application_fee_paid',
            'application_fee_proof_submitted' => 'notify_header_application_fee_proof_submitted',
            'application_fee_proof_rejected' => 'notify_header_application_fee_proof_rejected',
            'registry_reviewed' => 'notify_header_registry_reviewed',
            'approved' => 'notify_header_approved',
            'rejected' => 'notify_header_rejected',
            'admitted' => 'notify_header_admitted',
            'accepted' => 'notify_header_accepted',
            'tuition_paid' => 'notify_header_tuition_paid',
            'enrolled' => 'notify_header_enrolled',
        ];

        $application->loadMissing(['applicant.user', 'programme', 'institution']);
        $user = optional($application->applicant)->user;
        $replace = array_merge([
            'number' => $application->application_number,
            'name' => optional($application->applicant)->first_name ?: optional($user)->name,
            'programme' => optional($application->programme)->name ?: '—',
            'institution' => optional($application->institution)->name ?: '—',
        ], $replace);

        $headerKey = isset($headerKeys[$status])
            ? 'admissions.'.$headerKeys[$status]
            : 'admissions.notify_header_update';
        $bodyKey = isset($keys[$status])
            ? 'admissions.'.$keys[$status]
            : 'admissions.notify_status_title';
        $headerPair = $this->transPair($headerKey);
        $displayTitle = $this->formatter->title($headerPair['en'], optional($application->institution)->name, $headerPair['fr']);
        $bodyPair = $this->transPair($bodyKey, $replace);

        $lines = [
            $this->bilingualSummary($bodyKey, $replace),
            $this->bilingualField('admissions.notify_field_application', (string) $replace['number']),
            $this->bilingualField('admissions.notify_field_programme', (string) $replace['programme']),
        ];

        $amount = $this->statusFeeAmount($application, $status, $replace);
        if ($amount !== '') {
            $lines[] = $this->bilingualField('admissions.notify_field_amount', $amount);
        }

        if ($this->isPaymentStatus($status)) {
            $splitEn = $this->splitSummaryAction($bodyPair['en']);
            $splitFr = $this->splitSummaryAction($bodyPair['fr']);
            $lines[0] = $this->formatter->summary($splitEn[0], $splitFr[0]);
            if ($splitEn[1] !== '' || $splitFr[1] !== '') {
                $lines[] = $this->formatter->action(
                    $splitEn[1] !== '' ? $splitEn[1] : $splitFr[1],
                    $splitFr[1] !== '' ? $splitFr[1] : $splitEn[1]
                );
            }
        }

        $message = $this->formatBilingual(
            $headerKey,
            $replace['name'],
            $lines,
            optional($application->institution)->name
        );

        if ($application->applicant->user_id) {
            $this->createInAppNotification(
                $application->applicant->user_id,
                $application->institution_id,
                $displayTitle,
                $message,
                'admission'
            );

            $this->sendStatusEmail($application, $displayTitle, $message);
            $this->sendStatusWhatsApp($application, $message, $user);
        }
    }

    protected function sendStatusEmail(Application $application, $subject, $message)
    {
        $email = optional($application->applicant)->email;
        if (! $email) {
            return;
        }

        try {
            Mail::raw($message, function ($mail) use ($email, $subject) {
                $mail->to($email)->subject($subject);
            });
        } catch (\Exception $e) {
            Log::warning('Application status email failed: '.$e->getMessage());
        }
    }

    protected function sendStatusWhatsApp(Application $application, $message, $user = null)
    {
        if (! $this->whatsapp->isConfigured()) {
            return;
        }

        $phone = $this->whatsapp->normalizePhoneNumber((string) optional($application->applicant)->phone);
        if (! $phone) {
            return;
        }

        try {
            $result = $this->whatsapp->sendTextMessage($phone, $message, 'application_status');
            $this->messageLogs->logWhatsAppResult($application->institution_id, $result, [
                'recipient_name' => optional($application->applicant)->full_name,
                'phone_number' => $phone,
                'message_type' => 'text',
                'module' => 'admission',
                'related_id' => $application->id,
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            Log::warning('Application status WhatsApp failed: '.$e->getMessage());
        }
    }

    public function notifyRegistry(Application $application)
    {
        $this->notifyRoleUsers(
            'registry',
            $application,
            $this->transForUser('admissions.notify_status_title'),
            $this->transForUser('admissions.notify_registry_new', ['number' => $application->application_number])
        );
    }

    public function notifyDepartment(Application $application)
    {
        $application->loadMissing(['institution', 'programme']);
        $departmentId = optional($application->programme)->department_id;
        $users = User::where('institution_id', $application->institution_id)
            ->where('department_id', $departmentId)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['hod', 'head-of-department']);
            })
            ->get();

        foreach ($users as $user) {
            $headerPair = $this->transPair('admissions.notify_status_title');
            $message = $this->formatBilingual(
                'admissions.notify_status_title',
                null,
                [
                    $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                    $this->bilingualSummary('admissions.notify_department_review_body'),
                ],
                optional($application->institution)->name
            );

            $this->createInAppNotification(
                $user->id,
                $application->institution_id,
                $this->formatter->title($headerPair['en'], optional($application->institution)->name, $headerPair['fr']),
                $message,
                'admission'
            );
        }
    }

    public function notifyRegistrar(Application $application)
    {
        $this->notifyRoleUsers(
            'registrar',
            $application,
            $this->transForUser('admissions.notify_status_title'),
            $this->transForUser('admissions.notify_registrar_ready', ['number' => $application->application_number])
        );
    }

    public function notifyFinanceOfficer(Application $application)
    {
        $this->notifyRoleUsers(
            'finance-officer',
            $application,
            $this->transForUser('admissions.notify_status_title'),
            $this->transForUser('admissions.notify_finance_action', ['number' => $application->application_number])
        );
    }

    public function notifyPaymentProofSubmitted(\App\Modules\Admissions\Models\ApplicationPayment $payment)
    {
        $application = $payment->application;
        if (! $application) {
            return;
        }

        $institution = $application->institution ?? \App\Institution::find($application->institution_id);
        $currency = strtoupper((string) ($institution->currency ?? 'USD'));

        $application->loadMissing(['institution', 'programme', 'applicant']);
        $headerPair = $this->transPair('admissions.notify_header_application_fee_proof_submitted');
        $title = $this->formatter->title($headerPair['en'], optional($application->institution)->name, $headerPair['fr']);
        $message = $this->formatBilingual(
            'admissions.notify_header_application_fee_proof_submitted',
            null,
            [
                $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                $this->bilingualField('admissions.notify_field_amount', $currency.' '.number_format((float) $payment->amount, 2)),
                $this->bilingualAction('admissions.notify_payment_proof_submitted_body'),
            ],
            optional($application->institution)->name
        );

        $this->notifyRoleUsers('registry', $application, $title, $message);
        $this->notifyRoleUsers('finance-officer', $application, $title, $message);
    }

    public function notifyPaymentProofRejected(\App\Modules\Admissions\Models\ApplicationPayment $payment)
    {
        $application = $payment->application;
        $user = optional(optional($application)->applicant)->user;
        if (! $application || ! optional($application->applicant)->user_id) {
            return;
        }

        $application->loadMissing(['institution', 'programme', 'applicant.user']);
        $headerPair = $this->transPair('admissions.notify_header_application_fee_proof_rejected');
        $title = $this->formatter->title($headerPair['en'], optional($application->institution)->name, $headerPair['fr']);
        $message = $this->formatBilingual(
            'admissions.notify_header_application_fee_proof_rejected',
            optional($application->applicant)->first_name ?: optional($user)->name,
            [
                $this->bilingualField('admissions.notify_field_application', (string) $application->application_number),
                $this->bilingualField('admissions.notify_field_reason', $payment->review_notes ?: '—'),
                $this->bilingualAction('admissions.notify_payment_proof_rejected_body'),
            ],
            optional($application->institution)->name
        );

        $this->createInAppNotification(
            $application->applicant->user_id,
            $application->institution_id,
            $title,
            $message,
            'admission'
        );

        $this->sendStatusEmail($application, $title, $message);
        $this->sendStatusWhatsApp($application, $message, $user);
    }

    public function notifyHodForCourseRegistration($student)
    {
        $student->loadMissing(['programme', 'institution']);
        $users = User::where('institution_id', $student->institution_id)
            ->where('department_id', optional($student->programme)->department_id)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['hod', 'head-of-department']);
            })
            ->get();

        foreach ($users as $user) {
            $headerPair = $this->transPair('admissions.notify_status_title');
            $message = $this->formatBilingual(
                'admissions.notify_status_title',
                null,
                [
                    $this->bilingualField('admissions.notify_field_registration', (string) $student->registration_number),
                    $this->bilingualSummary('admissions.notify_course_pending_body'),
                ],
                optional($student->institution)->name
            );

            $this->createInAppNotification(
                $user->id,
                $student->institution_id,
                $this->formatter->title($headerPair['en'], optional($student->institution)->name, $headerPair['fr']),
                $message,
                'admission'
            );
        }
    }

    protected function notifyRoleUsers($roleName, Application $application, $title, $message)
    {
        $application->loadMissing(['institution', 'programme']);
        $users = User::where('institution_id', $application->institution_id)
            ->whereHas('roles', function ($q) use ($roleName) {
                $q->where('name', $roleName);
            })
            ->get();

        foreach ($users as $user) {
            $formatted = $this->formatter->isBranded((string) $message)
                ? $message
                : $this->formatter->wrap(
                    (string) $message,
                    (string) $title,
                    optional($application->institution)->name
                );

            $this->createInAppNotification(
                $user->id,
                $application->institution_id,
                $this->formatter->title((string) $title, optional($application->institution)->name),
                $formatted,
                'admission'
            );
        }
    }

    protected function transPair(string $key, array $replace = []): array
    {
        $previous = app()->getLocale();
        app()->setLocale('en');
        $en = (string) __($key, $replace);
        app()->setLocale('fr');
        $fr = (string) __($key, $replace);
        app()->setLocale($previous);

        return ['en' => $en, 'fr' => $fr];
    }

    protected function formatBilingual(string $headerKey, ?string $name, array $lines, ?string $institution, array $replace = []): string
    {
        $header = $this->transPair($headerKey, $replace);

        return $this->formatter->format(
            $header['en'],
            $name ? $this->formatter->greeting($name) : null,
            $lines,
            $institution,
            null,
            $header['fr']
        );
    }

    protected function bilingualField(string $key, string $value): array
    {
        $pair = $this->transPair($key);

        return $this->formatter->field($pair['en'], $value, '▫️', $pair['fr']);
    }

    protected function bilingualSummary(string $key, array $replace = []): array
    {
        $pair = $this->transPair($key, $replace);

        return $this->formatter->summary($pair['en'], $pair['fr']);
    }

    protected function bilingualAction(string $key, array $replace = []): array
    {
        $pair = $this->transPair($key, $replace);

        return $this->formatter->action($pair['en'], $pair['fr']);
    }

    /**
     * @return array{0:string,1:string}
     */
    protected function splitSummaryAction(string $text): array
    {
        $text = trim($text);
        if (preg_match('/^(.+?[.!?])\s+(.+)$/us', $text, $m)) {
            return [trim($m[1]), trim($m[2])];
        }

        return [$text, ''];
    }

    protected function isPaymentStatus($status): bool
    {
        return in_array($status, [
            'application_fee_paid',
            'application_fee_proof_submitted',
            'application_fee_proof_rejected',
            'tuition_paid',
            'tuition_proof_submitted',
        ], true);
    }

    protected function statusFeeAmount(Application $application, $status, array $replace = []): string
    {
        if (! $this->isPaymentStatus($status)) {
            return '';
        }

        if (! empty($replace['amount'])) {
            return trim((string) $replace['amount']);
        }

        $currency = strtoupper((string) (optional($application->institution)->currency ?: 'USD'));
        $amount = $status === 'tuition_paid'
            ? $application->tuition_fee
            : $application->application_fee;

        if ((float) $amount <= 0) {
            return '';
        }

        return $currency.' '.number_format((float) $amount, 2);
    }

    protected function createInAppNotification($userId, $institutionId, $title, $message, $category)
    {
        if (! $userId) {
            return null;
        }

        return AppNotification::create([
            'user_id' => $userId,
            'institution_id' => $institutionId,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'category' => $category,
            'is_read' => false,
        ]);
    }
}
