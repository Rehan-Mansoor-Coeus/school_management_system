import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Modal from '../../../components/ui/Modal';
import UploadProgressBar from '../../../components/ui/UploadProgressBar';
import {
  confirmStripePayment,
  createCampayPayment,
  createStripePaymentIntent,
  fetchPaymentMethods,
  formatValidationError,
  submitApplicationFeeProofWithProgress,
  submitTuitionProofWithProgress,
  verifyCampayPayment,
} from '../../../api/admissions';
import type { Application } from '../types';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

type PaymentMethods = {
  stripe?: { enabled: boolean; publishable_key?: string | null };
  campay?: { enabled: boolean };
  proof?: { enabled: boolean };
};

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
  const [method, setMethod] = useState<'stripe' | 'campay' | 'proof'>('proof');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [phone, setPhone] = useState('');
  const [campayReference, setCampayReference] = useState<string | null>(null);
  const [campayStatus, setCampayStatus] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setClientSecret(null);
    setCampayReference(null);
    setCampayStatus('');
    setProofFile(null);
    setUploadProgress(0);
    setMethodsError('');
    setMethodsLoading(true);

    fetchPaymentMethods(application?.id)
      .then((data) => {
        setMethods(data);
        if (data.stripe?.enabled) setMethod('stripe');
        else if (data.campay?.enabled) setMethod('campay');
        else setMethod('proof');
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
  const hasCampay = Boolean(methods?.campay?.enabled);
  const hasProof = methods?.proof?.enabled !== false;
  const hasAnyMethod = hasStripe || hasCampay || hasProof;

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
