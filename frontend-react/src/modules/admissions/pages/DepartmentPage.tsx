import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { decideDepartmentApplication, fetchDepartmentPending } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import ApplicationReviewPanel from '../components/ApplicationReviewPanel';

export default function DepartmentPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetchDepartmentPending();
    setApplications(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    if (status === 'rejected' && !rejectionReason.trim()) {
      window.alert(t('rejectionReasonRequired'));
      return;
    }
    setBusy(true);
    try {
      await decideDepartmentApplication(selected.id, {
        status,
        admission_comment: comment || undefined,
        rejection_reason: status === 'rejected' ? rejectionReason : undefined,
      });
      setSelected(null);
      setComment('');
      setRejectionReason('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold">{t('departmentPendingTitle')}</h2>
        {applications.map((app) => (
          <div key={app.id} className={`rounded-xl border p-4 ${selected?.id === app.id ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <button type="button" onClick={() => setSelected(app)} className="w-full text-left">
              <div className="font-medium">{app.application_number}</div>
              <div className="text-sm text-slate-500">{app.programme?.name}</div>
            </button>
            <div className="mt-3">
              <Link
                to={`/admissions/applications/${app.id}`}
                state={{ from: '/admissions/department' }}
                className="text-sm font-medium text-[#1e3a5f] hover:underline"
              >
                {t('viewDetails')}
              </Link>
            </div>
          </div>
        ))}
        {!applications.length && <p className="text-sm text-slate-500">{t('departmentNoPending')}</p>}
      </div>
      {selected ? (
        <ApplicationReviewPanel
          title={t('departmentReview')}
          hint={t('departmentSelectHint')}
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
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">{t('departmentSelectHint')}</p>
        </div>
      )}
    </div>
  );
}
