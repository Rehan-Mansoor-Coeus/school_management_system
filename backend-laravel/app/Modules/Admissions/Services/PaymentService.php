<?php

namespace App\Modules\Admissions\Services;

use App\Institution;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Services\InstitutionPaymentConfigResolver;
use App\Services\PawaPayCountryCatalog;
use App\Services\PawaPayFxService;
use App\Services\PawaPayService;
use App\Support\HttpClient;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentService
{
    protected $flutterwaveUrl = 'https://api.flutterwave.com/v3';

    protected $configResolver;

    public function __construct()
    {
        $this->configResolver = new InstitutionPaymentConfigResolver();
    }

    public function getAvailableMethods(?int $institutionId = null, ?Application $application = null): array
    {
        $institutionId = $institutionId ?: (int) optional($application)->institution_id ?: (int) optional(auth()->user())->institution_id;
        $stripe = $institutionId ? StripePaymentService::forInstitution($institutionId) : new StripePaymentService();
        $campay = $institutionId ? CampayPaymentService::forInstitution($institutionId) : new CampayPaymentService();
        $flutterwave = $institutionId ? $this->configResolver->flutterwave($institutionId) : ['enabled' => ! empty(config('services.flutterwave.secret_key')), 'secret_key' => config('services.flutterwave.secret_key')];
        $institution = $institutionId ? Institution::find($institutionId) : null;
        $pawapayConfigured = (new PawaPayService())->isConfigured();
        $school = PawaPayCountryCatalog::schoolContext($institution);
        $applicant = optional($application)->applicant;
        $payer = $pawapayConfigured
            ? PawaPayCountryCatalog::forPayer(
                (string) optional($applicant)->phone,
                optional($applicant)->country,
                $institution
            )
            : null;

        return [
            'stripe' => [
                'enabled' => $stripe->isConfigured(),
                'publishable_key' => $stripe->publicKey(),
            ],
            'campay' => [
                'enabled' => $campay->isConfigured() && ! $pawapayConfigured,
            ],
            'school' => $school,
            'pawapay' => [
                'enabled' => $pawapayConfigured,
                'country_code' => $payer['country_code'] ?? $school['country_code'] ?? null,
                'country_name' => $payer['country_name'] ?? $school['country_name'] ?? null,
                'currency' => $payer['currency'] ?? $school['currency'] ?? null,
                'phone_prefix' => $payer['phone_prefix'] ?? null,
                'phone_placeholder' => $payer['phone_placeholder'] ?? null,
                'providers' => $payer['providers'] ?? [],
                'school' => $school,
                'payer' => $payer ? $this->presentPayerCatalog($payer) : null,
            ],
            'flutterwave' => [
                'enabled' => ! empty($flutterwave['secret_key']) && ($flutterwave['enabled'] ?? true),
            ],
            'proof' => [
                'enabled' => true,
            ],
        ];
    }

    public function initializeStripePayment(Application $application, string $paymentType): ?array
    {
        $stripeService = StripePaymentService::forInstitution($application->institution_id);

        if (! $stripeService->isConfigured()) {
            return null;
        }

        if ($paymentType === 'application_fee' && ! $application->canPayApplicationFee()) {
            throw new \RuntimeException('Application fee cannot be paid for this application.');
        }

        if ($paymentType === 'tuition' && ! $application->canPayTuition()) {
            throw new \RuntimeException('Tuition cannot be paid for this application.');
        }

        $amount = $paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee;
        $referenceNumber = $this->generatePaymentReference();
        $stripeConfig = $this->configResolver->stripe($application->institution_id);
        $currency = $stripeConfig['currency'] ?? config('services.stripe.currency', 'usd');

        $intent = $stripeService->createPaymentIntent($amount, $currency, [
            'application_id' => $application->id,
            'payment_type' => $paymentType,
            'reference_number' => $referenceNumber,
        ]);

        if (! $intent || empty($intent['id'])) {
            return null;
        }

        ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'transaction_id' => $intent['id'],
            'payment_type' => $paymentType,
            'payment_method' => 'stripe',
            'amount' => $amount,
            'status' => 'pending',
            'description' => ucfirst(str_replace('_', ' ', $paymentType))." for {$application->application_number}",
            'gateway_response' => $intent,
        ]);

        return [
            'client_secret' => $intent['client_secret'] ?? null,
            'payment_intent_id' => $intent['id'],
            'reference_number' => $referenceNumber,
            'amount' => $amount,
            'currency' => $currency,
            'publishable_key' => $stripeService->publicKey(),
        ];
    }

    public function confirmStripePayment(string $paymentIntentId): ?array
    {
        $payment = ApplicationPayment::where('transaction_id', $paymentIntentId)
            ->where('payment_method', 'stripe')
            ->first();

        if (! $payment) {
            return null;
        }

        $stripeService = StripePaymentService::forInstitution($payment->institution_id);
        $intent = $stripeService->retrievePaymentIntent($paymentIntentId);
        if (! $intent) {
            return null;
        }

        if (($intent['status'] ?? '') === 'succeeded') {
            if ($payment->status !== 'completed') {
                $payment->markAsCompleted($paymentIntentId, $intent);
                $application = Application::find($payment->application_id);
                if ($application) {
                    $this->applyPaymentToApplication($application, $payment->payment_type, $payment);
                    $application->syncPaymentRecordsFromFlags();
                }
            }

            return [
                'payment' => $payment->fresh(),
                'application' => Application::find($payment->application_id),
                'status' => 'completed',
            ];
        }

        return [
            'payment' => $payment,
            'status' => $intent['status'] ?? 'pending',
        ];
    }

    public function initializeCampayPayment(Application $application, string $paymentType, string $phone): ?array
    {
        $campayService = CampayPaymentService::forInstitution($application->institution_id);

        if (! $campayService->isConfigured()) {
            return null;
        }

        if ($paymentType === 'application_fee' && ! $application->canPayApplicationFee()) {
            throw new \RuntimeException('Application fee cannot be paid for this application.');
        }

        if ($paymentType === 'tuition' && ! $application->canPayTuition()) {
            throw new \RuntimeException('Tuition cannot be paid for this application.');
        }

        $amount = $paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee;
        $referenceNumber = $this->generatePaymentReference();
        $campayConfig = $this->configResolver->campay($application->institution_id);
        $currency = $campayConfig['currency'] ?? config('services.campay.currency', 'XAF');
        $normalizedPhone = preg_replace('/\D+/', '', $phone);

        $collect = $campayService->initiateCollect([
            'amount' => $amount,
            'currency' => $currency,
            'from' => $normalizedPhone,
            'description' => ucfirst(str_replace('_', ' ', $paymentType)).' - '.$application->application_number,
            'external_reference' => $referenceNumber,
        ]);

        if (! $collect) {
            return null;
        }

        $campayReference = $collect['reference'] ?? $collect['ussd_code'] ?? $referenceNumber;

        ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'transaction_id' => $campayReference,
            'payment_type' => $paymentType,
            'payment_method' => 'campay',
            'amount' => $amount,
            'status' => 'pending',
            'description' => ucfirst(str_replace('_', ' ', $paymentType))." for {$application->application_number}",
            'gateway_response' => $collect,
        ]);

        return [
            'reference' => $campayReference,
            'reference_number' => $referenceNumber,
            'amount' => $amount,
            'currency' => $currency,
            'status' => $collect['status'] ?? 'PENDING',
            'message' => $collect['message'] ?? null,
        ];
    }

    public function verifyCampayPayment(string $reference): ?array
    {
        $payment = ApplicationPayment::where('payment_method', 'campay')
            ->where(function ($query) use ($reference) {
                $query->where('transaction_id', $reference)
                    ->orWhere('reference_number', $reference);
            })
            ->first();

        if (! $payment) {
            return null;
        }

        $campayService = CampayPaymentService::forInstitution($payment->institution_id);
        $status = $campayService->getTransactionStatus($payment->transaction_id);
        if (! $status) {
            return [
                'payment' => $payment,
                'status' => $payment->status,
            ];
        }

        $campayStatus = strtoupper($status['status'] ?? 'PENDING');

        if (in_array($campayStatus, ['SUCCESSFUL', 'SUCCESS'], true) && $payment->status !== 'completed') {
            $payment->markAsCompleted($payment->transaction_id, $status);
            $application = Application::find($payment->application_id);
            if ($application) {
                $this->applyPaymentToApplication($application, $payment->payment_type, $payment);
            }
        } elseif (in_array($campayStatus, ['FAILED', 'CANCELLED'], true)) {
            $payment->markAsFailed($status);
        }

        return [
            'payment' => $payment->fresh(),
            'application' => Application::find($payment->application_id),
            'campay_status' => $campayStatus,
            'status' => $payment->fresh()->status,
        ];
    }

    public function quotePawapayPayment(Application $application, string $paymentType, string $phone): array
    {
        $institution = $application->institution ?: Institution::find($application->institution_id);
        $applicant = $application->applicant;
        $school = PawaPayCountryCatalog::schoolContext($institution);
        $digits = PawaPayCountryCatalog::digitsOnly($phone);
        $fromPhone = PawaPayCountryCatalog::forPhone($phone);

        if ($digits !== '' && strlen($digits) >= 10 && ! $fromPhone) {
            throw new \RuntimeException(__('admissions.pawapay_phone_unsupported'));
        }

        $payer = PawaPayCountryCatalog::forPayer(
            $phone,
            optional($applicant)->country,
            $institution
        );
        if (! $payer) {
            throw new \RuntimeException(__('admissions.pawapay_phone_unsupported'));
        }

        $schoolAmount = (float) ($paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee);
        $schoolCurrency = $school['currency'] ?: $payer['currency'];
        $fx = (new PawaPayFxService())->convert($schoolAmount, $schoolCurrency, $payer['currency']);
        $providerCode = $payer['providers'][0]['code'] ?? '';
        $payerAmountString = PawaPayCountryCatalog::formatAmount(
            $fx['amount'],
            $providerCode ? PawaPayCountryCatalog::providerAllowsDecimals($providerCode, $payer) : false
        );

        return [
            'school' => $school,
            'payer' => $this->presentPayerCatalog($payer),
            'school_amount' => $schoolAmount,
            'school_currency' => $schoolCurrency,
            'payer_amount' => (float) $payerAmountString,
            'payer_amount_formatted' => $payerAmountString,
            'payer_currency' => $payer['currency'],
            'fx_rate' => $fx['rate'],
            'same_currency' => $schoolCurrency === $payer['currency'],
        ];
    }

    public function initializePawapayPayment(Application $application, string $paymentType, string $phone, ?string $provider = null): ?array
    {
        $pawapay = new PawaPayService();
        if (! $pawapay->isConfigured()) {
            return null;
        }

        if ($paymentType === 'application_fee' && ! $application->canPayApplicationFee()) {
            throw new \RuntimeException(__('admissions.fee_cannot_pay'));
        }

        if ($paymentType === 'tuition' && ! $application->canPayTuition()) {
            throw new \RuntimeException(__('admissions.tuition_cannot_pay'));
        }

        $quote = $this->buildPawapayQuote($application, $paymentType, $phone, $provider);
        $payer = $quote['payer'];
        $msisdn = $quote['msisdn'];
        $resolvedProvider = $quote['provider'];

        $depositId = (string) Str::uuid();
        $referenceNumber = $this->generatePaymentReference();

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'transaction_id' => $depositId,
            'payment_type' => $paymentType,
            'payment_method' => 'pawapay',
            'amount' => $quote['school_amount'],
            'status' => 'pending',
            'description' => ucfirst(str_replace('_', ' ', $paymentType))." for {$application->application_number}",
            'gateway_response' => [
                'school_amount' => $quote['school_amount'],
                'school_currency' => $quote['school_currency'],
                'payer_amount' => $quote['payer_amount_string'],
                'payer_currency' => $quote['payer_currency'],
                'fx_rate' => $quote['fx_rate'],
                'country' => $payer['country_code'],
                'provider' => $resolvedProvider,
                'phone' => $msisdn,
            ],
        ]);

        $result = $pawapay->createDeposit([
            'depositId' => $depositId,
            'amount' => $quote['payer_amount_string'],
            'currency' => $quote['payer_currency'],
            'payer' => [
                'type' => 'MMO',
                'accountDetails' => [
                    'phoneNumber' => $msisdn,
                    'provider' => $resolvedProvider,
                ],
            ],
            'customerMessage' => 'Okusoma fees',
            'clientReferenceId' => $referenceNumber,
            'metadata' => [
                ['applicationId' => (string) $application->id],
                ['paymentType' => $paymentType],
                ['schoolCurrency' => $quote['school_currency']],
                ['payerCountry' => $payer['country_code']],
            ],
        ]);

        if (! $result) {
            $payment->markAsFailed(['error' => 'empty_pawapay_response']);
            return null;
        }

        $status = strtoupper((string) ($result['status'] ?? ''));
        $payment->update(['gateway_response' => array_merge($payment->gateway_response ?: [], $result)]);

        if ($status === 'REJECTED') {
            $payment->markAsFailed($result);
            $message = data_get($result, 'failureReason.failureMessage')
                ?: __('admissions.pawapay_failed');
            throw new \RuntimeException($message);
        }

        return [
            'deposit_id' => $depositId,
            'reference' => $depositId,
            'reference_number' => $referenceNumber,
            'amount' => $quote['school_amount'],
            'currency' => $quote['school_currency'],
            'payer_amount' => $quote['payer_amount_string'],
            'payer_currency' => $quote['payer_currency'],
            'country_name' => $payer['country_name'],
            'provider' => $resolvedProvider,
            'status' => $status ?: 'ACCEPTED',
        ];
    }

    protected function buildPawapayQuote(Application $application, string $paymentType, string $phone, ?string $provider = null): array
    {
        $institution = $application->institution ?: Institution::find($application->institution_id);
        $applicant = $application->applicant;
        $school = PawaPayCountryCatalog::schoolContext($institution);
        $payer = PawaPayCountryCatalog::forPayer(
            $phone,
            optional($applicant)->country,
            $institution
        );

        if (! $payer) {
            throw new \RuntimeException(__('admissions.pawapay_phone_unsupported'));
        }

        $fromPhone = PawaPayCountryCatalog::forPhone($phone);
        if ($phone !== '' && PawaPayCountryCatalog::digitsOnly($phone) !== '' && ! $fromPhone) {
            $digits = PawaPayCountryCatalog::digitsOnly($phone);
            if (strlen($digits) >= 8) {
                throw new \RuntimeException(__('admissions.pawapay_phone_unsupported'));
            }
        }

        $msisdn = PawaPayCountryCatalog::normalizePhone($phone, $payer);
        $resolvedProvider = $provider ?: PawaPayCountryCatalog::detectProvider($msisdn, $payer);

        if (! $resolvedProvider) {
            $predicted = (new PawaPayService())->predictProvider($msisdn);
            $resolvedProvider = data_get($predicted, 'provider')
                ?: data_get($predicted, 'data.provider');
        }

        if (! $resolvedProvider || ! PawaPayCountryCatalog::providerBelongsToCountry((string) $resolvedProvider, $payer)) {
            throw new \RuntimeException(__('admissions.pawapay_operator_required'));
        }

        $prefix = $payer['phone_prefix'];
        $localLength = (int) $payer['local_length'];
        if (! preg_match('/^'.$prefix.'[1-9][0-9]{'.($localLength - 1).','.($localLength + 1).'}$/', $msisdn)) {
            throw new \RuntimeException(__('admissions.pawapay_phone_invalid'));
        }

        $schoolAmount = (float) ($paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee);
        $schoolCurrency = $school['currency'] ?: $payer['currency'];
        if ($schoolCurrency === '') {
            throw new \RuntimeException(__('admissions.pawapay_country_unavailable'));
        }

        $fx = (new PawaPayFxService())->convert($schoolAmount, $schoolCurrency, $payer['currency']);
        $payerAmountString = PawaPayCountryCatalog::formatAmount(
            $fx['amount'],
            PawaPayCountryCatalog::providerAllowsDecimals((string) $resolvedProvider, $payer)
        );

        return [
            'school' => $school,
            'payer' => $payer,
            'msisdn' => $msisdn,
            'provider' => $resolvedProvider,
            'school_amount' => $schoolAmount,
            'school_currency' => $schoolCurrency,
            'payer_amount' => (float) $payerAmountString,
            'payer_amount_string' => $payerAmountString,
            'payer_currency' => $payer['currency'],
            'fx_rate' => $fx['rate'],
        ];
    }

    protected function presentPayerCatalog(array $catalog): array
    {
        return [
            'country_code' => $catalog['country_code'] ?? null,
            'country_name' => $catalog['country_name'] ?? null,
            'currency' => $catalog['currency'] ?? null,
            'phone_prefix' => $catalog['phone_prefix'] ?? null,
            'phone_placeholder' => $catalog['phone_placeholder'] ?? null,
            'providers' => $catalog['providers'] ?? [],
        ];
    }

    public function verifyPawapayPayment(string $depositId): ?array
    {
        $payment = ApplicationPayment::where('payment_method', 'pawapay')
            ->where(function ($query) use ($depositId) {
                $query->where('transaction_id', $depositId)
                    ->orWhere('reference_number', $depositId);
            })
            ->first();

        if (! $payment) {
            return null;
        }

        $payload = (new PawaPayService())->getDeposit($payment->transaction_id);
        $this->applyPawapayStatus($payment, $payload ?: []);

        $fresh = $payment->fresh();

        return [
            'payment' => $fresh,
            'application' => Application::find($payment->application_id),
            'pawapay_status' => (new PawaPayService())->extractDepositStatus($payload),
            'status' => $fresh ? $fresh->status : $payment->status,
        ];
    }

    public function processPawapayCallback(array $payload): bool
    {
        $depositId = (new PawaPayService())->extractDepositId($payload);
        if (! $depositId) {
            return false;
        }

        $payment = ApplicationPayment::where('payment_method', 'pawapay')
            ->where('transaction_id', $depositId)
            ->first();

        if (! $payment) {
            return false;
        }

        $this->applyPawapayStatus($payment, $payload);

        return true;
    }

    protected function applyPawapayStatus(ApplicationPayment $payment, array $payload): void
    {
        $status = (new PawaPayService())->extractDepositStatus($payload);

        if (in_array($status, ['COMPLETED', 'SUCCESSFUL', 'SUCCESS'], true) && $payment->status !== 'completed') {
            $payment->markAsCompleted($payment->transaction_id, array_merge($payment->gateway_response ?: [], $payload));
            $application = Application::find($payment->application_id);
            if ($application) {
                $this->applyPaymentToApplication($application, $payment->payment_type, $payment);
            }

            return;
        }

        if (in_array($status, ['FAILED', 'REJECTED', 'CANCELLED'], true) && $payment->status === 'pending') {
            $payment->markAsFailed($payload);
        }
    }

    public function initializePayment(Application $application, $paymentType = 'application_fee', $amount = null)
    {
        $referenceNumber = $this->generatePaymentReference();
        $amount = $amount ?? ($paymentType === 'tuition' ? $application->tuition_fee : $application->application_fee);
        $flutterwave = $this->configResolver->flutterwave($application->institution_id);
        $flutterwaveKey = $flutterwave['secret_key'] ?? null;
        $flutterwaveEnabled = ! empty($flutterwaveKey) && ($flutterwave['enabled'] ?? false);

        if (! $flutterwaveEnabled && $paymentType === 'application_fee') {
            return [
                'payment_id' => null,
                'reference_number' => null,
                'payment_link' => null,
                'offline_mode' => true,
                'requires_proof' => true,
                'amount' => $amount,
                'payment_type' => $paymentType,
            ];
        }

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'payment_type' => $paymentType,
            'payment_method' => $flutterwaveEnabled ? 'flutterwave' : 'online',
            'amount' => $amount,
            'status' => 'pending',
            'description' => ucfirst(str_replace('_', ' ', $paymentType))." for {$application->application_number}",
        ]);

        if (! $flutterwaveEnabled) {
            return [
                'payment_id' => $payment->id,
                'reference_number' => $referenceNumber,
                'payment_link' => null,
                'offline_mode' => true,
                'amount' => $amount,
                'payment_type' => $paymentType,
            ];
        }

        $paymentLink = $this->createFlutterwavePaymentLink($application, $referenceNumber, $amount, $paymentType, $flutterwaveKey);

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
        if ($paymentType === 'application_fee') {
            throw new \InvalidArgumentException('Application fee requires payment proof upload.');
        }

        $amount = $application->tuition_fee;
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

    public function submitApplicationFeeProof(Application $application, UploadedFile $proof, $notes = null, $paymentReference = null)
    {
        if (! $application->canSubmitApplicationFeeProof()) {
            throw new \RuntimeException('Application fee proof cannot be submitted for this application.');
        }

        $folder = 'admissions/payment-proofs/'.$application->id;
        $path = $proof->store($folder, 'public');
        $referenceNumber = $paymentReference ?: $this->generatePaymentReference();

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'payment_type' => 'application_fee',
            'payment_method' => 'bank_transfer',
            'amount' => $application->application_fee,
            'status' => 'pending',
            'description' => 'Application fee proof for '.$application->application_number,
            'proof_path' => $path,
            'proof_notes' => $notes,
        ]);

        $payment->load(['application.applicant', 'application.programme']);

        try {
            (new NotificationService())->notifyPaymentProofSubmitted($payment);
            (new NotificationService())->sendApplicationStatusNotification($application, 'application_fee_proof_submitted');
        } catch (\Throwable $e) {
            \Log::warning('Payment proof notification failed: '.$e->getMessage());
        }

        return $payment;
    }

    public function submitTuitionProof(Application $application, UploadedFile $proof, $notes = null, $paymentReference = null)
    {
        if (! $application->canSubmitTuitionProof()) {
            throw new \RuntimeException('Tuition payment proof cannot be submitted for this application.');
        }

        $folder = 'admissions/payment-proofs/'.$application->id;
        $path = $proof->store($folder, 'public');
        $referenceNumber = $paymentReference ?: $this->generatePaymentReference();

        $payment = ApplicationPayment::create([
            'institution_id' => $application->institution_id,
            'application_id' => $application->id,
            'reference_number' => $referenceNumber,
            'payment_type' => 'tuition',
            'payment_method' => 'bank_transfer',
            'amount' => $application->tuition_fee,
            'status' => 'pending',
            'description' => 'Tuition fee proof for '.$application->application_number,
            'proof_path' => $path,
            'proof_notes' => $notes,
        ]);

        $payment->load(['application.applicant', 'application.programme']);

        try {
            (new NotificationService())->notifyPaymentProofSubmitted($payment);
            (new NotificationService())->notifyFinanceOfficer($application);
            (new NotificationService())->sendApplicationStatusNotification($application, 'tuition_proof_submitted');
        } catch (\Throwable $e) {
            \Log::warning('Tuition proof notification failed: '.$e->getMessage());
        }

        return $payment;
    }

    public function approvePaymentProof(ApplicationPayment $payment, $userId, $notes = null)
    {
        if ($payment->status !== 'pending' || ! $payment->proof_path) {
            throw new \RuntimeException('This payment proof is not awaiting review.');
        }

        $payment->markAsApproved($userId, $notes);
        $application = Application::find($payment->application_id);
        if ($application) {
            $this->applyPaymentToApplication($application, $payment->payment_type, $payment);
        }

        return $payment->fresh(['application.applicant', 'application.programme', 'reviewer']);
    }

    public function rejectPaymentProof(ApplicationPayment $payment, $userId, $reason)
    {
        if ($payment->status !== 'pending' || ! $payment->proof_path) {
            throw new \RuntimeException('This payment proof is not awaiting review.');
        }

        if ($payment->proof_path) {
            Storage::disk('public')->delete($payment->proof_path);
        }

        $payment->markAsRejected($userId, $reason);
        $payment->load('application.applicant');
        (new NotificationService())->notifyPaymentProofRejected($payment);
        (new NotificationService())->sendApplicationStatusNotification(
            $payment->application,
            'application_fee_proof_rejected',
            ['reason' => $reason]
        );

        return $payment->fresh(['application.applicant', 'application.programme', 'reviewer']);
    }

    public function listPendingProofs($institutionId, $paymentType = 'application_fee')
    {
        $query = ApplicationPayment::where('institution_id', $institutionId)
            ->pendingProof()
            ->with(['application.applicant', 'application.programme', 'application.academicYear'])
            ->orderByDesc('created_at');

        if ($paymentType !== 'all') {
            $query->where('payment_type', $paymentType);
        }

        return $query->get();
    }

    protected function createFlutterwavePaymentLink($application, $referenceNumber, $amount, $paymentType, $flutterwaveKey = null)
    {
        $flutterwaveKey = $flutterwaveKey ?: config('services.flutterwave.secret_key');
        if (! $flutterwaveKey) {
            return null;
        }

        $institution = $application->institution ?? \App\Institution::find($application->institution_id);
        $currency = strtoupper((string) (optional($institution)->currency ?? 'USD'));

        try {
            $response = HttpClient::postJson(
                $this->flutterwaveUrl.'/payments',
                [
                    'tx_ref' => $referenceNumber,
                    'amount' => $amount,
                    'currency' => $currency,
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
                ],
                ['Authorization' => 'Bearer '.$flutterwaveKey]
            )->json();

            if (($response['status'] ?? '') === 'success') {
                return $response['data']['link'] ?? null;
            }
        } catch (\Exception $e) {
            \Log::error('Flutterwave payment initialization failed: '.$e->getMessage());
        }

        return null;
    }

    public function verifyPayment($transactionId, ?int $institutionId = null)
    {
        $flutterwaveKey = $institutionId
            ? ($this->configResolver->flutterwave($institutionId)['secret_key'] ?? null)
            : config('services.flutterwave.secret_key');

        if (! $flutterwaveKey) {
            return null;
        }

        try {
            return HttpClient::get(
                $this->flutterwaveUrl.'/transactions/'.$transactionId.'/verify',
                ['Authorization' => 'Bearer '.$flutterwaveKey]
            )->json();
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
                $this->applyPaymentToApplication($application, $payment->payment_type, $payment);
            }

            return true;
        }

        $payment->markAsFailed($data);

        return false;
    }

    protected function applyPaymentToApplication(Application $application, $paymentType, ?ApplicationPayment $payment = null)
    {
        if ($paymentType === 'application_fee') {
            $application->update([
                'application_fee_paid' => true,
                'fee_paid_at' => now(),
            ]);
            $notificationService = new NotificationService();
            $notificationService->notifyRegistry($application);
            $notificationService->sendApplicationStatusNotification($application, 'application_fee_paid');
        } elseif ($paymentType === 'tuition') {
            $application->markTuitionPaid();
            $notificationService = new NotificationService();

            if ($payment && $this->isDigitalPaymentMethod($payment->payment_method)) {
                $this->autoEnrollAfterDigitalTuition($application, $notificationService);
            } else {
                $notificationService->notifyFinanceOfficer($application);
                $notificationService->sendApplicationStatusNotification($application, 'tuition_paid');
            }
        }
    }

    protected function isDigitalPaymentMethod(?string $method): bool
    {
        return in_array($method, ['stripe', 'campay', 'pawapay', 'flutterwave', 'online'], true);
    }

    protected function autoEnrollAfterDigitalTuition(Application $application, NotificationService $notificationService): void
    {
        try {
            $enrollmentService = new EnrollmentService();
            $result = $enrollmentService->enrollFromApplication($application, null);
            $student = $result['student'];
            $plainPassword = $result['plain_password'];
            $user = optional($student)->user;

            if ($plainPassword && $user) {
                (new \App\Services\UserAccountNotificationService())->notifyEnrollmentWithAccount(
                    $user,
                    $plainPassword,
                    $student->registration_number
                );
            } else {
                $notificationService->sendApplicationStatusNotification($application->fresh(), 'enrolled', [
                    'reg' => optional($student)->registration_number,
                ]);
            }
        } catch (\Throwable $e) {
            \Log::warning('Auto-enrollment after digital tuition failed: '.$e->getMessage());
            $notificationService->notifyFinanceOfficer($application);
            $notificationService->sendApplicationStatusNotification($application, 'tuition_paid');
        }
    }

    protected function generatePaymentReference()
    {
        return 'PAY-'.date('YmdHis').'-'.Str::random(8);
    }
}
