import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { fetchRegistryPending, reviewRegistryApplication } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import PaymentProofReviewSection from '../components/PaymentProofReviewSection';

export default function RegistryPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchRegistryPending();
      setApplications(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    await reviewRegistryApplication(selected.id, {
      decision,
      admission_comment: comment || undefined,
      rejection_reason: decision === 'rejected' ? rejectionReason : undefined,
    });
    setSelected(null);
    setComment('');
    setRejectionReason('');
    await load();
  };

  if (loading) return <p className="text-slate-500">{t('loading')}</p>;

  return (
    <div className="space-y-6">
      <PaymentProofReviewSection />
      <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold text-slate-900">{t('registryPendingTitle')}</h2>
        {!applications.length && <p className="text-slate-500 text-sm">{t('registryNoPending')}</p>}
        {applications.map((app) => (
          <div key={app.id} className={`rounded-xl border p-4 transition ${selected?.id === app.id ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <button type="button" onClick={() => setSelected(app)} className="w-full text-left">
              <div className="font-medium">{app.application_number}</div>
              <div className="text-sm text-slate-500">{app.applicant?.full_name || `${app.applicant?.first_name} ${app.applicant?.last_name}`} · {app.programme?.name}</div>
            </button>
            <div className="mt-3">
              <Link
                to={`/admissions/applications/${app.id}`}
                state={{ from: '/admissions/registry' }}
                className="text-sm font-medium text-[#1e3a5f] hover:underline"
              >
                {t('viewDetails')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold mb-3">{t('registryReviewTitle')}</h3>
        {!selected ? (
          <p className="text-sm text-slate-500">{t('registrySelectHint')}</p>
        ) : (
          <>
            <textarea className="w-full rounded-lg border border-slate-200 p-2 text-sm mb-3" placeholder={t('commentOptional')} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            <textarea className="w-full rounded-lg border border-slate-200 p-2 text-sm mb-3" placeholder={t('rejectionReason')} rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" onClick={() => submit('approved')} className="flex-1 rounded-lg bg-green-600 py-2 text-sm text-white">{t('approve')}</button>
              <button type="button" onClick={() => submit('rejected')} className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white">{t('reject')}</button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
