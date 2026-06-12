import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { fetchFinancePending, verifyTuition } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import PaymentProofReviewSection from '../components/PaymentProofReviewSection';
import { useFormatMoney } from '../../../hooks/useFormatMoney';
import ApplicationReviewPanel from '../components/ApplicationReviewPanel';

export default function FinancePage() {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const res = await fetchFinancePending();
    setApplications(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async () => {
    if (!selected) return;
    setBusy(selected.id);
    try {
      await verifyTuition(selected.id);
      setSelected(null);
      setComment('');
      setRejectionReason('');
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentProofReviewSection paymentType="all" onUpdated={load} />
      <div className="space-y-4">
      <h2 className="font-semibold">{t('financeTitle')}</h2>
      <p className="text-sm text-slate-500">{t('financeSubtitle')}</p>
      {!applications.length && <p className="text-sm text-slate-500">{t('financeNoPending')}</p>}
      {applications.map((app) => (
        <div key={app.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 ${selected?.id === app.id ? 'border-[#1e3a5f] bg-blue-50' : ''}`}>
          <button type="button" onClick={() => setSelected(app)} className="flex-1 text-left">
            <div className="font-medium">{app.application_number}</div>
            <div className="text-sm text-slate-500">{app.applicant?.first_name} {app.applicant?.last_name} · {formatMoney(app.tuition_fee)}</div>
            <Link
              to={`/admissions/applications/${app.id}`}
              state={{ from: '/admissions/finance' }}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-block text-sm font-medium text-[#1e3a5f] hover:underline"
            >
              {t('viewDetails')}
            </Link>
          </button>
        </div>
      ))}

      {selected && (
        <ApplicationReviewPanel
          title={t('financeTitle')}
          hint={t('financeSubtitle')}
          comment={comment}
          onCommentChange={setComment}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onValidate={handleVerify}
          onReject={() => setSelected(null)}
          validateLabel={t('validateAndGenerateReg')}
          rejectLabel={t('cancel')}
          busy={busy === selected.id}
        />
      )}
      </div>
    </div>
  );
}
