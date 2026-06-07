import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentAdmissionsDashboard } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { statusLabelKey } from '../../../i18n/admissions';
import ApplicationProgressBar, { type ApplicationProgress } from './ApplicationProgressBar';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

type ApplicationSummary = {
  id: number;
  application_number: string;
  status: string;
  programme?: string | null;
  academic_year?: string | null;
  application_fee_paid: boolean;
  progress_percent: number;
  progress?: ApplicationProgress;
};

type DashboardData = {
  total_applications: number;
  active_applications: number;
  enrolled_count: number;
  pending_fee_count: number;
  unread_notifications: number;
  applications_summary?: ApplicationSummary[];
  registration_fee_status?: { status: string; amount: number; paid: boolean };
  tuition_fee_status?: { status: string; amount: number; paid: boolean };
  enrollment?: {
    programme?: { id: number; name: string } | null;
    current_level?: number;
    level?: { id: number; name: string; level_number?: number } | null;
    semester?: { id: number; name: string } | null;
    semester_fee?: number;
    amount_paid?: number;
    outstanding_balance?: number;
    expected_payment_date?: string | null;
    latest_payment_date?: string | null;
    payment_status?: string;
  } | null;
};

export default function StudentAdmissionsStats() {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentAdmissionsDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>;
  }

  if (!data) {
    return null;
  }

  const stats = [
    { label: t('statTotalApplications'), value: data.total_applications },
    { label: t('statActiveApplications'), value: data.active_applications },
    { label: t('statEnrolled'), value: data.enrolled_count },
    { label: t('statPendingFee'), value: data.pending_fee_count },
    { label: t('statUnreadNotifications'), value: data.unread_notifications },
  ];

  const applications = data.applications_summary || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {(data.registration_fee_status || data.tuition_fee_status) && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.registration_fee_status && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{t('registrationFee')}</p>
              <p className="mt-1 font-semibold text-slate-900 capitalize">{data.registration_fee_status.paid ? t('paid') : data.registration_fee_status.status}</p>
              <p className="text-sm text-slate-500">{formatMoney(data.registration_fee_status.amount || 0)}</p>
            </div>
          )}
          {data.tuition_fee_status && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{t('tuitionFee')}</p>
              <p className="mt-1 font-semibold text-slate-900 capitalize">{data.tuition_fee_status.paid ? t('paid') : data.tuition_fee_status.status}</p>
              <p className="text-sm text-slate-500">{formatMoney(data.tuition_fee_status.amount || 0)}</p>
            </div>
          )}
        </div>
      )}

      {data.enrollment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3">Semester fee status</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><dt className="text-slate-400">Programme</dt><dd>{data.enrollment.programme?.name || '—'}</dd></div>
            <div><dt className="text-slate-400">Level</dt><dd>{data.enrollment.level?.name || data.enrollment.current_level || '—'}</dd></div>
            <div><dt className="text-slate-400">Semester</dt><dd>{data.enrollment.semester?.name || '—'}</dd></div>
            <div><dt className="text-slate-400">Status</dt><dd className="capitalize">{data.enrollment.payment_status || '—'}</dd></div>
            <div><dt className="text-slate-400">Semester fee</dt><dd>{formatMoney(data.enrollment.semester_fee || 0)}</dd></div>
            <div><dt className="text-slate-400">Paid</dt><dd>{formatMoney(data.enrollment.amount_paid || 0)}</dd></div>
            <div><dt className="text-slate-400">Outstanding</dt><dd>{formatMoney(data.enrollment.outstanding_balance || 0)}</dd></div>
            <div><dt className="text-slate-400">Expected date</dt><dd>{data.enrollment.expected_payment_date || '—'}</dd></div>
            <div><dt className="text-slate-400">Latest date</dt><dd>{data.enrollment.latest_payment_date || '—'}</dd></div>
          </dl>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">{t('yourApplications')}</h3>
            <p className="text-sm text-slate-500">{t('yourApplicationsHint')}</p>
          </div>
          <Link
            to="/admissions/my-applications"
            className="text-sm font-medium text-[#1e3a5f] hover:underline"
          >
            {t('trackApplication')}
          </Link>
        </div>

        {!applications.length ? (
          <p className="text-sm text-slate-500">{t('noApplications')}</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{app.application_number}</p>
                    <p className="text-sm text-slate-500">
                      {[app.programme, app.academic_year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {t(statusLabelKey(app.status))}
                  </span>
                </div>
                <ApplicationProgressBar progress={app.progress} compact />
                <div className="mt-3">
                  <Link
                    to={`/admissions/my-applications/${app.id}`}
                    className="text-sm font-medium text-[#1e3a5f] hover:underline"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
