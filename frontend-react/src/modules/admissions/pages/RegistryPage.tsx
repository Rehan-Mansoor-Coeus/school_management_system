import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { fetchApplication, fetchRegistryPending, reviewRegistryApplication } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import PaymentProofReviewSection from '../components/PaymentProofReviewSection';
import ApplicationDocumentReviewSection from '../components/ApplicationDocumentReviewSection';
import ApplicationReviewPanel from '../components/ApplicationReviewPanel';

export default function RegistryPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Application | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    if (!selected?.id) {
      setSelectedDetail(null);
      return;
    }
    fetchApplication(selected.id).then(setSelectedDetail).catch(() => setSelectedDetail(selected));
  }, [selected]);

  const submit = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    if (decision === 'rejected' && !rejectionReason.trim()) {
      window.alert(t('rejectionReasonRequired'));
      return;
    }
    setBusy(true);
    try {
      await reviewRegistryApplication(selected.id, {
        decision,
        admission_comment: comment || undefined,
        rejection_reason: decision === 'rejected' ? rejectionReason : undefined,
      });
      setSelected(null);
      setSelectedDetail(null);
      setComment('');
      setRejectionReason('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const refreshSelected = async () => {
    if (!selected?.id) return;
    const detail = await fetchApplication(selected.id);
    setSelectedDetail(detail);
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

        {selectedDetail?.documents?.length ? (
          <ApplicationDocumentReviewSection
            documents={selectedDetail.documents}
            onUpdated={refreshSelected}
          />
        ) : null}
      </div>

      {selected ? (
        <ApplicationReviewPanel
          title={t('registryReviewTitle')}
          hint={t('registrySelectHint')}
          comment={comment}
          onCommentChange={setComment}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onValidate={() => submit('approved')}
          onReject={() => submit('rejected')}
          validateLabel={t('validate')}
          rejectLabel={t('reject')}
          busy={busy}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{t('registrySelectHint')}</p>
        </div>
      )}
      </div>
    </div>
  );
}
