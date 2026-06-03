import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Application } from '../types';
import {
  acceptAdmission,
  confirmOfflinePayment,
  fetchMyApplications,
  payApplicationFee,
  payTuition,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { statusLabelKey } from '../../../i18n/admissions';

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    registry_reviewed: 'bg-blue-100 text-blue-800',
    department_approved: 'bg-indigo-100 text-indigo-800',
    admitted: 'bg-purple-100 text-purple-800',
    accepted: 'bg-teal-100 text-teal-800',
    tuition_paid: 'bg-orange-100 text-orange-800',
    enrolled: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const key = statusLabelKey(status);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {t(key)}
    </span>
  );
}

export default function MyApplicationsPage() {
  const { t } = useAdmissionsI18n();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMyApplications();
      setApplications(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePayFee = async (app: Application, type: 'application_fee' | 'tuition') => {
    setActionId(app.id);
    try {
      const init = type === 'application_fee' ? await payApplicationFee(app.id) : await payTuition(app.id);
      if (init.data?.payment_link) {
        window.open(init.data.payment_link, '_blank');
      } else {
        await confirmOfflinePayment(app.id, type);
        await load();
      }
    } finally {
      setActionId(null);
    }
  };

  const handleAccept = async (appId: number) => {
    setActionId(appId);
    try {
      await acceptAdmission(appId);
      await load();
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <p className="text-slate-500">{t('loadingApplications')}</p>;

  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-600 mb-4">{t('noApplications')}</p>
        <a href="/admissions/apply" className="text-[#1e3a5f] font-medium hover:underline">{t('startNewApplication')}</a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{app.application_number}</h3>
              <p className="text-sm text-slate-500">{app.programme?.name} · {app.academic_year?.name}</p>
            </div>
            <StatusBadge status={app.status} t={t} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><dt className="text-slate-400">{t('applicationFee')}</dt><dd>{app.application_fee_paid ? t('paid') : `₦${app.application_fee}`}</dd></div>
            <div><dt className="text-slate-400">{t('tuition')}</dt><dd>{app.tuition_fee_paid ? t('paid') : `₦${app.tuition_fee ?? 0}`}</dd></div>
            <div><dt className="text-slate-400">{t('letterSent')}</dt><dd>{app.admission_letter_sent ? t('yes') : t('no')}</dd></div>
            <div><dt className="text-slate-400">{t('accepted')}</dt><dd>{app.admission_accepted ? t('yes') : t('no')}</dd></div>
          </dl>

          {app.rejection_reason && (
            <p className="mt-3 text-sm text-red-600">{t('reason')}: {app.rejection_reason}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/admissions/my-applications/${app.id}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('viewDetails')}
            </Link>
            {app.status === 'submitted' && !app.application_fee_paid && (
              <button type="button" disabled={actionId === app.id} onClick={() => handlePayFee(app, 'application_fee')} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a73] disabled:opacity-50">
                {t('payApplicationFee')}
              </button>
            )}
            {app.status === 'admitted' && !app.admission_accepted && (
              <button type="button" disabled={actionId === app.id} onClick={() => handleAccept(app.id)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {t('acceptAdmission')}
              </button>
            )}
            {app.status === 'accepted' && !app.tuition_fee_paid && (
              <button type="button" disabled={actionId === app.id} onClick={() => handlePayFee(app, 'tuition')} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a73] disabled:opacity-50">
                {t('payTuition')}
              </button>
            )}
            {app.status === 'enrolled' && (
              <a href="/admissions/courses" className="rounded-lg border border-[#1e3a5f] px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-50">
                {t('registerCoursesLink')}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
