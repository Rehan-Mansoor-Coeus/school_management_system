<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class PaymentService
{
    protected $flutterwave_url = 'https://api.flutterwave.com/v3';
    protected $flutterwave_key;

    public function __construct()
    {
        $this->flutterwave_key = config('services.flutterwave.secret_key');
    }

    public function initializePayment(Application $application)
    {
        $referenceNumber = $this->generatePaymentReference();

        // Create payment record
        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'reference_number' => $referenceNumber,
            'payment_type' => 'application_fee',
            'payment_method' => 'flutterwave',
            'amount' => $application->application_fee,
            'status' => 'pending',
            'description' => "Application Fee for {$application->application_number}",
        ]);

        // Initialize Flutterwave payment
        $paymentLink = $this->createFlutterwavePaymentLink(
            $application,
            $referenceNumber
        );

        return [
            'payment_id' => $payment->id,
            'reference_number' => $referenceNumber,
            'payment_link' => $paymentLink,
            'amount' => $application->application_fee,
        ];
    }

    protected function createFlutterwavePaymentLink($application, $referenceNumber)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->flutterwave_key,
            ])->post($this->flutterwave_url . '/payments', [
                'tx_ref' => $referenceNumber,
                'amount' => $application->application_fee,
                'currency' => 'NGN', // Change based on institution country
                'redirect_url' => route('api.admissions.payment.verify'),
                'customer' => [
                    'email' => $application->applicant->email,
                    'phone_number' => $application->applicant->phone,
                    'name' => $application->applicant->full_name,
                ],
                'customizations' => [
                    'title' => 'Application Fee',
                    'description' => "Admission Application Fee",
                    'logo' => $application->institution->logo_path,
                ],
                'meta' => [
                    'application_id' => $application->id,
                ],
            ])->json();

            if ($response['status'] === 'success') {
                return $response['data']['link'];
            }

            return null;
        } catch (\Exception $e) {
            \Log::error('Flutterwave payment initialization failed: ' . $e->getMessage());
            return null;
        }
    }

    public function verifyPayment($transactionId)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->flutterwave_key,
            ])->get($this->flutterwave_url . '/transactions/' . $transactionId . '/verify')
                ->json();

            return $response;
        } catch (\Exception $e) {
            \Log::error('Flutterwave payment verification failed: ' . $e->getMessage());
            return null;
        }
    }

    public function processPaymentWebhook($payload)
    {
        $data = $payload['data'];

        $payment = ApplicationPayment::byReference($data['tx_ref'])->first();

        if (!$payment) {
            return false;
        }

        if ($data['status'] === 'successful') {
            $payment->markAsCompleted($data['id'], $data);

            // Update application fee payment status
            $application = Application::where('id', $data['meta']['application_id'] ?? null)->first();
            if ($application) {
                $application->update([
                    'application_fee_paid' => true,
                    'fee_paid_at' => now(),
                ]);
            }

            return true;
        } else {
            $payment->markAsFailed($data);
            return false;
        }
    }

    protected function generatePaymentReference()
    {
        return 'APP-' . date('YmdHis') . '-' . Str::random(8);
    }
}
