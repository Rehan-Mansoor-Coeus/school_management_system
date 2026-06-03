<?php

namespace App\Modules\Admissions\Services;

use App\AppNotification;
use App\Modules\Admissions\Concerns\TranslatesAdmissions;
use App\Modules\Admissions\Models\Application;
use App\User;
use App\Services\Messaging\MessageLogService;
use App\Services\Messaging\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class NotificationService
{
    use TranslatesAdmissions;

    protected $whatsapp;

    protected $messageLogs;

    public function __construct()
    {
        $this->whatsapp = new WhatsAppService();
        $this->messageLogs = new MessageLogService();
    }

    public function sendAdmissionLetter(Application $application, $pdfPath)
    {
        $user = optional($application->applicant)->user;
        $this->sendAdmissionEmail($application, $pdfPath);
        $whatsappResult = $this->sendAdmissionWhatsApp($application, $pdfPath);
        $this->createInAppNotification(
            $application->applicant->user_id,
            $application->institution_id,
            $this->admissionsTrans('notify_admission_letter_title', [], $user),
            $this->admissionsTrans('notify_admission_letter_body', [], $user),
            'admission'
        );
        $application->markAdmissionLetterSent();

        return $whatsappResult;
    }

    protected function sendAdmissionEmail(Application $application, $pdfPath)
    {
        try {
            $applicant = $application->applicant;
            $institution = $application->institution;
            $user = $applicant->user;
            $locale = $this->admissionsLocale($user);

            $subject = $this->admissionsTrans('email_subject', [
                'number' => $application->application_number,
            ], $user);

            $body = $this->admissionsTrans('email_admitted_body', [
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

            $message = $this->admissionsTrans('whatsapp_admitted', [
                'name' => $applicant->first_name,
                'institution' => $application->institution->name,
                'programme' => $application->programme->name,
                'number' => $application->application_number,
            ], $user);

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
            $caption = $this->admissionsTrans('whatsapp_letter_caption', [
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

    public function sendApplicationStatusNotification(Application $application, $status)
    {
        $keys = [
            'submitted' => 'notify_submitted',
            'registry_reviewed' => 'notify_registry_reviewed',
            'approved' => 'notify_approved',
            'rejected' => 'notify_rejected',
            'admitted' => 'notify_admitted',
            'accepted' => 'notify_accepted',
            'tuition_paid' => 'notify_tuition_paid',
            'enrolled' => 'notify_enrolled',
        ];

        $user = optional($application->applicant)->user;
        $message = isset($keys[$status])
            ? $this->admissionsTrans($keys[$status], [], $user)
            : $this->admissionsTrans('notify_status_title', [], $user);

        if ($application->applicant->user_id) {
            $this->createInAppNotification(
                $application->applicant->user_id,
                $application->institution_id,
                $this->admissionsTrans('notify_status_title', [], $user),
                $message,
                'admission'
            );
        }
    }

    public function notifyRegistry(Application $application)
    {
        $this->notifyRoleUsers(
            'registry',
            $application,
            $this->admissionsTrans('notify_status_title'),
            $this->admissionsTrans('notify_registry_new', ['number' => $application->application_number])
        );
    }

    public function notifyDepartment(Application $application)
    {
        $departmentId = optional($application->programme)->department_id;
        $users = User::where('institution_id', $application->institution_id)
            ->where('department_id', $departmentId)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['hod', 'head-of-department']);
            })
            ->get();

        foreach ($users as $user) {
            $this->createInAppNotification(
                $user->id,
                $application->institution_id,
                $this->admissionsTrans('notify_status_title', [], $user),
                $this->admissionsTrans('notify_department_review', ['number' => $application->application_number], $user),
                'admission'
            );
        }
    }

    public function notifyRegistrar(Application $application)
    {
        $this->notifyRoleUsers(
            'registrar',
            $application,
            $this->admissionsTrans('notify_status_title'),
            $this->admissionsTrans('notify_registrar_ready', ['number' => $application->application_number])
        );
    }

    public function notifyFinanceOfficer(Application $application)
    {
        $this->notifyRoleUsers(
            'finance-officer',
            $application,
            $this->admissionsTrans('notify_status_title'),
            $this->admissionsTrans('notify_finance_action', ['number' => $application->application_number])
        );
    }

    public function notifyHodForCourseRegistration($student)
    {
        $student->loadMissing('programme');
        $users = User::where('institution_id', $student->institution_id)
            ->where('department_id', optional($student->programme)->department_id)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['hod', 'head-of-department']);
            })
            ->get();

        foreach ($users as $user) {
            $this->createInAppNotification(
                $user->id,
                $student->institution_id,
                $this->admissionsTrans('notify_status_title', [], $user),
                $this->admissionsTrans('notify_course_pending', ['reg' => $student->registration_number], $user),
                'admission'
            );
        }
    }

    protected function notifyRoleUsers($roleName, Application $application, $title, $message)
    {
        $users = User::where('institution_id', $application->institution_id)
            ->whereHas('roles', function ($q) use ($roleName) {
                $q->where('name', $roleName);
            })
            ->get();

        foreach ($users as $user) {
            $this->createInAppNotification(
                $user->id,
                $application->institution_id,
                $this->admissionsTrans('notify_status_title', [], $user),
                $message,
                'admission'
            );
        }
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
