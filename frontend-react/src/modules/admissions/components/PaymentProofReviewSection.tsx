import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approvePaymentProof,
  fetchPendingPaymentProofs,
  rejectPaymentProof,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useFormatMoney } from '../../../hooks/useFormatMoney';
import { publicFileUrl } from '../../../utils/publicFileUrl';
import type { ApplicationPaymentProof } from '../types';

type Props = {
  paymentType?: 'application_fee' | 'tuition' | 'all';
  onUpdated?: () => void;
};

export default function PaymentProofReviewSection({ paymentType = 'application_fee', onUpdated }: Props) {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const [proofs, setProofs] = useState<ApplicationPaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPendingPaymentProofs(paymentType);
      setProofs(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [paymentType]);

  const refresh = async () => {
    await load();
    onUpdated?.();
  };

  const approve = async (id: number) => {
    setBusyId(id);
    try {
      await approvePaymentProof(id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) return;
    setBusyId(id);
    try {
      await rejectPaymentProof(id, rejectReason.trim());
      setRejectId(null);
      setRejectReason('');
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const paymentTypeLabel = (type: string) => {
    if (type === 'tuition') return t('tuitionProofType');
    if (type === 'application_fee') return t('registrationProofType');
    return type;
  };

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
      <div>
        <h2 className="font-semibold text-slate-900">
          {paymentType === 'all' ? t('pendingAllProofsTitle') : t('pendingFeeProofsTitle')}
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{t('loading')}</p>
      ) : !proofs.length ? (
        <p className="text-sm text-slate-500">{t('pendingFeeProofsEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{proof.application?.application_number}</div>
                  <div className="text-xs font-medium uppercase tracking-wide text-amber-800">{paymentTypeLabel(proof.payment_type)}</div>
                  <div className="text-sm text-slate-500">
                    {proof.application?.applicant?.full_name
                      || `${proof.application?.applicant?.first_name || ''} ${proof.application?.applicant?.last_name || ''}`.trim()}
                    {' · '}
                    {proof.application?.programme?.name}
                  </div>
                  <div className="mt-1 text-sm">{formatMoney(proof.amount)} · {proof.reference_number}</div>
                  {proof.proof_notes && <p className="mt-2 text-sm text-slate-600">{proof.proof_notes}</p>}
                  {proof.application_id && (
                    <Link
                      to={`/admissions/applications/${proof.application_id}`}
                      state={{ from: window.location.pathname }}
                      className="mt-2 inline-block text-sm font-medium text-[#1e3a5f] hover:underline"
                    >
                      {t('viewDetails')}
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                {proof.proof_url && (
                  <a href={publicFileUrl(proof.proof_url) || proof.proof_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#1e3a5f] hover:underline">
                    {t('viewProof')}
                  </a>
                )}
                </div>
              </div>

              {rejectId === proof.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('rejectProofReason')}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => reject(proof.id)} disabled={busyId === proof.id} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
                      {t('rejectProof')}
                    </button>
                    <button type="button" onClick={() => { setRejectId(null); setRejectReason(''); }} className="rounded-lg border px-3 py-1.5 text-sm">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => approve(proof.id)} disabled={busyId === proof.id} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    {t('approveProof')}
                  </button>
                  <button type="button" onClick={() => setRejectId(proof.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">
                    {t('rejectProof')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
