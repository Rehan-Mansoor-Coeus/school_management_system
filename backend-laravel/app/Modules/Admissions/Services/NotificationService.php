<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Models\Application;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $twilio_url = 'https://api.twilio.com';
    protected $twilio_account_sid;
    protected $twilio_auth_token;

    public function __construct()
    {
        $this->twilio_account_sid = config('services.twilio.account_sid');
        $this->twilio_auth_token = config('services.twilio.auth_token');
    }

    public function sendAdmissionLetter(Application $application, $pdfPath)
    {
        // Send via Email
        $this->sendEmailNotification($application, $pdfPath);

        // Send via WhatsApp
        $this->sendWhatsAppNotification($application);

        // Create in-app notification
        $this->createInAppNotification(
            $application->applicant->user_id,
            $application->institution_id,
            'Admission Letter',
            'Your admission letter has been generated and sent to your email and WhatsApp.',
            'admission'
        );

        $application->markAdmissionLetterSent();
    }

    protected function sendEmailNotification(Application $application, $pdfPath)
    {
        try {
            $applicant = $application->applicant;
            $institution = $application->institution;

            // Here you would use your Mail class - creating a custom Mailable
            $subject = "Admission Letter - {$application->application_number}";
            $message = "Dear {$applicant->first_name},\n\nCongratulations on your admission to {$institution->name}. Please find attached your admission letter.";

            // Example: Mail::send(new AdmissionLetterMail($application, $pdfPath));

            Log::info("Admission letter sent to {$applicant->email}");

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send admission letter email: ' . $e->getMessage());
            return false;
        }
    }

    protected function sendWhatsAppNotification(Application $application)
    {
        try {
            $applicant = $application->applicant;
            $institution = $application->institution;

            $message = "Hello {$applicant->first_name}, Congratulations! You have been admitted to {$institution->name} for the {$application->programme->name} programme. Please check your email for the admission letter. Thank you.";

            // Use Twilio WhatsApp API or any WhatsApp gateway
            // Example using a hypothetical WhatsApp service:
            // $this->sendWhatsAppViaTwilio($applicant->phone, $message);

            Log::info("WhatsApp notification sent to {$applicant->phone}");

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification: ' . $e->getMessage());
            return false;
        }
    }

    public function sendApplicationStatusNotification(Application $application, $status)
    {
        $messages = [
            'submitted' => 'Your application has been received.',
            'under_review' => 'Your application is under review.',
            'approved' => 'Congratulations! Your application has been approved.',
            'rejected' => 'Unfortunately, your application has been rejected.',
            'admitted' => 'You have been admitted! Please check your email for the admission letter.',
        ];

        $message = $messages[$status] ?? 'Your application status has been updated.';

        if ($application->applicant->user_id) {
            $this->createInAppNotification(
                $application->applicant->user_id,
                $application->institution_id,
                'Application Status Update',
                $message,
                'admission'
            );
        }

        // Send email
        if ($status === 'approved' || $status === 'rejected') {
            $this->sendEmailNotification($application);
        }
    }

    protected function createInAppNotification($userId, $institutionId, $title, $message, $category)
    {
        return Notification::create([
            'user_id' => $userId,
            'institution_id' => $institutionId,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'category' => $category,
            'is_read' => false,
        ]);
    }

    public function notifyAdmissionBoard(Application $application)
    {
        // Get all admission board members
        $boardMembers = $application->institution->users()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'admission_board');
            })
            ->get();

        foreach ($boardMembers as $member) {
            $this->createInAppNotification(
                $member->id,
                $application->institution_id,
                'New Application Submitted',
                "New application #{$application->application_number} from {$application->applicant->full_name} is awaiting review.",
                'admission'
            );
        }
    }

    public function notifyRegistrar(Application $application)
    {
        $registrar = $application->institution->users()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'registrar');
            })
            ->first();

        if ($registrar) {
            $this->createInAppNotification(
                $registrar->id,
                $application->institution_id,
                'Application Ready for Admission',
                "Application #{$application->application_number} is approved and ready for admission.",
                'admission'
            );
        }
    }

    public function notifyFinanceOfficer(Application $application)
    {
        $financeOfficer = $application->institution->users()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'finance_officer');
            })
            ->first();

        if ($financeOfficer) {
            $this->createInAppNotification(
                $financeOfficer->id,
                $application->institution_id,
                'Application Fee Payment Received',
                "Application fee of {$application->application_fee} received for application #{$application->application_number}.",
                'admission'
            );
        }
    }
}
