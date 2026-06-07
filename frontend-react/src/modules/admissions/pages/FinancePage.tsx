import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { fetchFinancePending, verifyTuition } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import PaymentProofReviewSection from '../components/PaymentProofReviewSection';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

export default function FinancePage() {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const [applications, setApplications] = useState<Application[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const res = await fetchFinancePending();
    setApplications(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id: number) => {
    setBusy(id);
    try {
      await verifyTuition(id);
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
        <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div>
            <div className="font-medium">{app.application_number}</div>
            <div className="text-sm text-slate-500">{app.applicant?.first_name} {app.applicant?.last_name} · {formatMoney(app.tuition_fee)}</div>
            <Link
              to={`/admissions/applications/${app.id}`}
              state={{ from: '/admissions/finance' }}
              className="mt-2 inline-block text-sm font-medium text-[#1e3a5f] hover:underline"
            >
              {t('viewDetails')}
            </Link>
          </div>
          <button type="button" disabled={busy === app.id} onClick={() => handleVerify(app.id)} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            {t('verifyAndGenerateReg')}
          </button>
        </div>
      ))}
      </div>
    </div>
  );
}
