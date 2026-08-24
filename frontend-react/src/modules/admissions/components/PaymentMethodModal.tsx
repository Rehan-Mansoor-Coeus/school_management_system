import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Modal from '../../../components/ui/Modal';
import UploadProgressBar from '../../../components/ui/UploadProgressBar';
import {
  confirmStripePayment,
  createCampayPayment,
  createPawapayPayment,
  createStripePaymentIntent,
  fetchPaymentMethods,
  fetchPawapayQuote,
  formatValidationError,
  submitApplicationFeeProofWithProgress,
  submitTuitionProofWithProgress,
  verifyCampayPayment,
  verifyPawapayPayment,
} from '../../../api/admissions';
import type { Application } from '../types';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

type PawapayProvider = { code: string; label: string };

type PawapayPayer = {
  country_name?: string | null;
  currency?: string | null;
  phone_placeholder?: string | null;
  providers?: PawapayProvider[];
};

type PaymentMethods = {
  stripe?: { enabled: boolean; publishable_key?: string | null };
  campay?: { enabled: boolean };
  school?: { country_name?: string | null; currency?: string | null };
  pawapay?: {
    enabled: boolean;
    country_code?: string | null;
    country_name?: string | null;
    currency?: string | null;
    phone_prefix?: string | null;
    phone_placeholder?: string | null;
    providers?: PawapayProvider[];
    school?: { country_name?: string | null; currency?: string | null };
    payer?: PawapayPayer | null;
  };
  proof?: { enabled: boolean };
};

type PawapayQuote = {
  school?: { country_name?: string | null; currency?: string | null };
  payer?: PawapayPayer;
  school_amount?: number;
  school_currency?: string;
  payer_amount_formatted?: string;
  payer_currency?: string;
};

type PayMethod = 'stripe' | 'campay' | 'pawapay' | 'proof';

type Props = {
  application: Application | null;
  paymentType: 'application_fee' | 'tuition';
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function StripeCheckoutForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const { t } = useAdmissionsI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        onError(result.error.message || t('paymentFailed'));
        return;
      }

      const intentId = result.paymentIntent?.id;
      if (intentId) {
        await confirmStripePayment(intentId);
      }
      onSuccess();
    } catch {
      onError(t('paymentFailed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {processing ? t('processingPayment') : t('payWithCard')}
      </button>
    </form>
  );
}

export default function PaymentMethodModal({ application, paymentType, open, onClose, onSuccess }: Props) {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodsError, setMethodsError] = useState('');
  const [method, setMethod] = useState<PayMethod>('proof');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('');
  const [campayReference, setCampayReference] = useState<string | null>(null);
  const [campayStatus, setCampayStatus] = useState('');
  const [pawapayReference, setPawapayReference] = useState<string | null>(null);
  const [pawapayStatus, setPawapayStatus] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [quote, setQuote] = useState<PawapayQuote | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setClientSecret(null);
    setCampayReference(null);
    setCampayStatus('');
    setPawapayReference(null);
    setPawapayStatus('');
    setProvider('');
    setPolling(false);
    setQuote(null);
    setProofFile(null);
    setUploadProgress(0);
    setMethodsError('');
    setMethodsLoading(true);

    fetchPaymentMethods(application?.id)
      .then((data) => {
        setMethods(data);
        if (data.stripe?.enabled) setMethod('stripe');
        else if (data.pawapay?.enabled) setMethod('pawapay');
        else if (data.campay?.enabled) setMethod('campay');
        else setMethod('proof');
        const firstProvider = data.pawapay?.payer?.providers?.[0]?.code || data.pawapay?.providers?.[0]?.code || '';
        if ((data.pawapay?.payer?.providers?.length || data.pawapay?.providers?.length || 0) === 1) {
          setProvider(firstProvider);
        }
      })
      .catch(() => {
        setMethods({ proof: { enabled: true } });
        setMethodsError(t('paymentMethodsLoadFailed'));
        setMethod('proof');
      })
      .finally(() => setMethodsLoading(false));

    if (application?.applicant?.phone) {
      setPhone(application.applicant.phone);
    }
  }, [open, application]);

  useEffect(() => {
    if (!open || !application || method !== 'stripe' || !methods?.stripe?.enabled) return;

    let cancelled = false;
    setLoading(true);
    createStripePaymentIntent(application.id, paymentType)
      .then((data) => {
        if (cancelled) return;
        setClientSecret(data.client_secret || null);
        if (data.publishable_key) {
          setStripePromise(loadStripe(data.publishable_key));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(formatValidationError(err, t('stripeNotConfigured')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, application, method, methods, paymentType, t]);

  useEffect(() => {
    if (!campayReference || !polling) return;

    const interval = window.setInterval(async () => {
      try {
        const result = await verifyCampayPayment(campayReference);
        const status = result.campay_status || result.status || '';
        setCampayStatus(status);
        if (result.status === 'completed' || status === 'SUCCESSFUL' || status === 'SUCCESS') {
          window.clearInterval(interval);
          setPolling(false);
          onSuccess();
          onClose();
        }
      } catch {
        // keep polling
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [campayReference, polling, onClose, onSuccess]);

  useEffect(() => {
    if (!pawapayReference || !polling) return;

    const interval = window.setInterval(async () => {
      try {
        const result = await verifyPawapayPayment(pawapayReference);
        const status = result.pawapay_status || result.status || '';
        setPawapayStatus(status);
        if (result.status === 'completed' || status === 'COMPLETED' || status === 'SUCCESSFUL' || status === 'SUCCESS') {
          window.clearInterval(interval);
          setPolling(false);
          onSuccess();
          onClose();
        }
        if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
          window.clearInterval(interval);
          setPolling(false);
          setError(t('pawapayFailed'));
        }
      } catch {
        // keep polling
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [pawapayReference, polling, onClose, onSuccess, t]);

  useEffect(() => {
    if (!open || !application || method !== 'pawapay' || !methods?.pawapay?.enabled) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchPawapayQuote(application.id, paymentType, phone.trim());
        if (cancelled) return;
        setQuote(data);
        setError('');
        const nextProviders = data.payer?.providers || [];
        setProvider((current) => {
          if (current && nextProviders.some((item) => item.code === current)) return current;
          return nextProviders.length === 1 ? nextProviders[0].code : '';
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setQuote(null);
          if (phone.trim().length >= 10) {
            setError(formatValidationError(err, t('pawapayFailed')));
          }
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, application, method, methods, paymentType, phone, t]);

  const startCampay = async () => {
    if (!application || !phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await createCampayPayment(application.id, paymentType, phone.trim());
      setCampayReference(result.reference || result.reference_number);
      setCampayStatus(result.status || 'PENDING');
      setPolling(true);
    } catch {
      setError(t('campayFailed'));
    } finally {
      setLoading(false);
    }
  };

  const startPawapay = async () => {
    if (!application || !phone.trim()) return;
    const providers = quote?.payer?.providers || methods?.pawapay?.payer?.providers || methods?.pawapay?.providers || [];
    if (providers.length > 1 && !provider) {
      setError(t('momoSelectOperator'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createPawapayPayment(application.id, paymentType, phone.trim(), provider || undefined);
      setPawapayReference(result.deposit_id || result.reference || result.reference_number || null);
      setPawapayStatus(result.status || 'ACCEPTED');
      setPolling(true);
    } catch (err: unknown) {
      setError(formatValidationError(err, t('pawapayFailed')));
    } finally {
      setLoading(false);
    }
  };

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !proofFile) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('application_id', String(application.id));
      formData.append('proof', proofFile);
      if (proofNotes) formData.append('proof_notes', proofNotes);
      if (paymentReference) formData.append('payment_reference', paymentReference);
      if (paymentType === 'tuition') {
        await submitTuitionProofWithProgress(application.id, formData, setUploadProgress);
      } else {
        await submitApplicationFeeProofWithProgress(application.id, formData, setUploadProgress);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(formatValidationError(err, t('paymentFailed')));
    } finally {
      setLoading(false);
    }
  };

  const amount = paymentType === 'tuition' ? application?.tuition_fee : application?.application_fee;
  const hasStripe = Boolean(methods?.stripe?.enabled);
  const hasPawapay = Boolean(methods?.pawapay?.enabled);
  const hasCampay = Boolean(methods?.campay?.enabled) && !hasPawapay;
  const hasProof = methods?.proof?.enabled !== false;
  const hasAnyMethod = hasStripe || hasPawapay || hasCampay || hasProof;
  const schoolInfo = quote?.school || methods?.pawapay?.school || methods?.school;
  const payerInfo = quote?.payer || methods?.pawapay?.payer;
  const pawapayProviders = payerInfo?.providers || methods?.pawapay?.providers || [];
  const operatorLabel = pawapayProviders.find((item) => item.code === provider)?.label
    || payerInfo?.country_name
    || 'Mobile Money';
  const schoolFeeLabel = t('momoSchoolFee')
    .replace('{currency}', quote?.school_currency || schoolInfo?.currency || '')
    .replace('{amount}', String(quote?.school_amount ?? amount ?? ''))
    .replace('{country}', schoolInfo?.country_name || '');
  const payerChargeLabel = t('momoPayerCharge')
    .replace('{currency}', quote?.payer_currency || payerInfo?.currency || '')
    .replace('{amount}', quote?.payer_amount_formatted || '')
    .replace('{operator}', operatorLabel);
  const momoHint = t('momoPayerHint')
    .replace('{currency}', quote?.school_currency || schoolInfo?.currency || '');

  return (
    <Modal
      title={paymentType === 'tuition' ? t('payTuition') : t('payApplicationFee')}
      open={open}
      onClose={onClose}
      footer={null}
    >
      {application && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {application.application_number} · {formatMoney(amount || 0)}
          </p>

          {methodsLoading ? (
            <p className="text-sm text-slate-500">{t('loadingPaymentMethods')}</p>
          ) : (
            <>
          <p className="text-xs text-slate-500">{t('choosePaymentMethod')}</p>

          <div className="flex flex-wrap gap-2">
            {hasStripe && (
              <button
                type="button"
                onClick={() => setMethod('stripe')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${method === 'stripe' ? 'bg-[#1e3a5f] text-white' : 'border border-slate-300 text-slate-700'}`}
              >
                {t('payWithCard')}
              </button>
            )}
            {hasPawapay && (
              <button
                type="button"
                onClick={() => setMethod('pawapay')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${method === 'pawapay' ? 'bg-[#1e3a5f] text-white' : 'border border-slate-300 text-slate-700'}`}
              >
                {t('payWithMomo')}
              </button>
            )}
            {hasCampay && (
              <button
                type="button"
                onClick={() => setMethod('campay')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${method === 'campay' ? 'bg-[#1e3a5f] text-white' : 'border border-slate-300 text-slate-700'}`}
              >
                {t('payWithMomo')}
              </button>
            )}
            {hasProof && (
              <button
                type="button"
                onClick={() => setMethod('proof')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${method === 'proof' ? 'bg-[#1e3a5f] text-white' : 'border border-slate-300 text-slate-700'}`}
              >
                {t('payManually')}
              </button>
            )}
          </div>

          {!hasAnyMethod && (
            <p className="text-sm text-amber-700">{t('noPaymentMethodsConfigured')}</p>
          )}
            </>
          )}

          {methodsError && <p className="text-sm text-amber-700">{methodsError}</p>}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {method === 'stripe' && !methodsLoading && (
            <div>
              {loading && <p className="text-sm text-slate-500">{t('loading')}</p>}
              {!loading && clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm
                    onSuccess={() => {
                      onSuccess();
                      onClose();
                    }}
                    onError={setError}
                  />
                </Elements>
              )}
              {!loading && !clientSecret && <p className="text-sm text-slate-500">{t('stripeNotConfigured')}</p>}
            </div>
          )}

          {method === 'pawapay' && !methodsLoading && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 space-y-1">
                <p>{schoolFeeLabel}</p>
                {quote?.payer_amount_formatted && <p>{payerChargeLabel}</p>}
                <p className="text-xs text-slate-500">{momoHint}</p>
              </div>
              {pawapayProviders.length > 1 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">{t('momoOperator')}</p>
                  <div className="flex flex-wrap gap-2">
                    {pawapayProviders.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setProvider(item.code)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${provider === item.code ? 'bg-[#1e3a5f] text-white' : 'border border-slate-300 text-slate-700'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={payerInfo?.phone_placeholder || methods?.pawapay?.phone_placeholder || t('momoPhonePlaceholder')}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              {!pawapayReference ? (
                <button
                  type="button"
                  disabled={loading || !phone.trim()}
                  onClick={startPawapay}
                  className="w-full rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? t('processingPayment') : t('payWithMomo')}
                </button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p>{t('pawapayPrompt')}</p>
                  <p className="mt-2 font-mono text-xs">{pawapayReference}</p>
                  {pawapayStatus && <p className="mt-2">{t('status')}: {pawapayStatus}</p>}
                </div>
              )}
            </div>
          )}

          {method === 'campay' && !methodsLoading && (
            <div className="space-y-3">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('momoPhonePlaceholder')}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              {!campayReference ? (
                <button
                  type="button"
                  disabled={loading || !phone.trim()}
                  onClick={startCampay}
                  className="w-full rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? t('processingPayment') : t('payWithMomo')}
                </button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p>{t('campayPrompt')}</p>
                  <p className="mt-2 font-mono text-xs">{campayReference}</p>
                  {campayStatus && <p className="mt-2">{t('status')}: {campayStatus}</p>}
                </div>
              )}
            </div>
          )}

          {method === 'proof' && !methodsLoading && (
            <form onSubmit={submitProof} className="space-y-3">
              <p className="text-sm text-slate-500">{t('manualPaymentHint')}</p>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('proofFile')}</label>
                <input
                  required
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
              {proofFile && loading && (
                <UploadProgressBar progress={uploadProgress} label={proofFile.name} />
              )}
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={t('paymentReference')}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <textarea
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder={t('proofNotes')}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                rows={3}
              />
              <button
                type="submit"
                disabled={!proofFile || loading}
                className="w-full rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t('uploadPaymentProof')}
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
