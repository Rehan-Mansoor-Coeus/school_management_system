<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentService
{
    protected $flutterwaveUrl = 'https://api.flutterwave.com/v3';
    protected $flutterwaveKey;

    public function __construct()
    {
        $this->flutterwaveKey = config('services.flutterwave.secret_key');
    }

    public function initializePayment(Application $application, $paymentType = 'application_fee', $amount = null)
    {
        $referenceNumber = $this->generatePaymentReference();
        $amount = $amount ?? ($paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee);

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'payment_type' => $paymentType,
            'payment_method' => $this->flutterwaveKey ? 'flutterwave' : 'online',
            'amount' => $amount,
            'status' => 'pending',
            'description' => ucfirst(str_replace('_', ' ', $paymentType))." for {$application->application_number}",
        ]);

        if (! $this->flutterwaveKey) {
            return [
                'payment_id' => $payment->id,
                'reference_number' => $referenceNumber,
                'payment_link' => null,
                'offline_mode' => true,
                'amount' => $amount,
                'payment_type' => $paymentType,
            ];
        }

        $paymentLink = $this->createFlutterwavePaymentLink($application, $referenceNumber, $amount, $paymentType);

        return [
            'payment_id' => $payment->id,
            'reference_number' => $referenceNumber,
            'payment_link' => $paymentLink,
            'offline_mode' => false,
            'amount' => $amount,
            'payment_type' => $paymentType,
        ];
    }

    public function confirmOfflinePayment(Application $application, $paymentType)
    {
        $amount = $paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee;
        $referenceNumber = $this->generatePaymentReference();

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'transaction_id' => 'OFFLINE-'.Str::upper(Str::random(10)),
            'payment_type' => $paymentType,
            'payment_method' => 'bank_transfer',
            'amount' => $amount,
            'status' => 'completed',
            'paid_at' => now(),
            'description' => 'Offline '.str_replace('_', ' ', $paymentType).' payment',
        ]);

        $this->applyPaymentToApplication($application, $paymentType);

        return [
            'payment' => $payment,
            'application' => $application->fresh(),
        ];
    }

    protected function createFlutterwavePaymentLink($application, $referenceNumber, $amount, $paymentType)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->flutterwaveKey,
            ])->post($this->flutterwaveUrl.'/payments', [
                'tx_ref' => $referenceNumber,
                'amount' => $amount,
                'currency' => 'NGN',
                'redirect_url' => config('app.url').'/admissions/checkout',
                'customer' => [
                    'email' => $application->applicant->email,
                    'phone_number' => $application->applicant->phone,
                    'name' => $application->applicant->full_name,
                ],
                'customizations' => [
                    'title' => ucfirst(str_replace('_', ' ', $paymentType)),
                    'description' => 'Admission payment',
                ],
                'meta' => [
                    'application_id' => $application->id,
                    'payment_type' => $paymentType,
                ],
            ])->json();

            if (($response['status'] ?? '') === 'success') {
                return $response['data']['link'] ?? null;
            }
        } catch (\Exception $e) {
            \Log::error('Flutterwave payment initialization failed: '.$e->getMessage());
        }

        return null;
    }

    public function verifyPayment($transactionId)
    {
        if (! $this->flutterwaveKey) {
            return null;
        }

        try {
            return Http::withHeaders([
                'Authorization' => 'Bearer '.$this->flutterwaveKey,
            ])->get($this->flutterwaveUrl.'/transactions/'.$transactionId.'/verify')
                ->json();
        } catch (\Exception $e) {
            \Log::error('Flutterwave payment verification failed: '.$e->getMessage());

            return null;
        }
    }

    public function processPaymentWebhook($payload)
    {
        $data = $payload['data'] ?? [];

        $payment = ApplicationPayment::byReference($data['tx_ref'] ?? '')->first();
        if (! $payment) {
            return false;
        }

        if (($data['status'] ?? '') === 'successful') {
            $payment->markAsCompleted($data['id'] ?? null, $data);

            $application = Application::find($payment->application_id);
            if ($application) {
                $this->applyPaymentToApplication($application, $payment->payment_type);
            }

            return true;
        }

        $payment->markAsFailed($data);

        return false;
    }

    protected function applyPaymentToApplication(Application $application, $paymentType)
    {
        if ($paymentType === 'application_fee') {
            $application->update([
                'application_fee_paid' => true,
                'fee_paid_at' => now(),
            ]);
            (new NotificationService())->notifyRegistry($application);
        } elseif ($paymentType === 'tuition') {
            $application->markTuitionPaid();
            (new NotificationService())->notifyFinanceOfficer($application);
        }
    }

    protected function generatePaymentReference()
    {
        return 'PAY-'.date('YmdHis').'-'.Str::random(8);
    }
}
