import { useEffect, useState } from 'react';
import type { Application } from '../types';
import {
  acceptAdmission,
  cancelApplication,
  fetchMyApplications,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { statusLabelKey } from '../../../i18n/admissions';
import ApplicationProgressBar from '../components/ApplicationProgressBar';
import PaymentMethodModal from '../components/PaymentMethodModal';
import StudentApplicationActions from '../components/StudentApplicationActions';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

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
    cancelled: 'bg-slate-100 text-slate-600',
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
  const { formatMoney } = useFormatMoney();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [paymentApp, setPaymentApp] = useState<Application | null>(null);
  const [paymentType, setPaymentType] = useState<'application_fee' | 'tuition'>('application_fee');

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

  const openPayment = (app: Application, type: 'application_fee' | 'tuition') => {
    setPaymentApp(app);
    setPaymentType(type);
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

  const handleCancel = async (appId: number) => {
    if (!window.confirm(t('cancelApplicationConfirm'))) return;
    setActionId(appId);
    try {
      await cancelApplication(appId);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const feeStatusLabel = (app: Application) => {
    if (app.application_fee_paid) return t('paid');
    if (app.application_fee_proof_pending) return t('feeProofPending');
    const latest = app.latest_application_fee_payment;
    if (latest?.status === 'failed') return t('feeProofRejected');
    return formatMoney(app.application_fee);
  };

  const tuitionStatusLabel = (app: Application) => {
    if (app.tuition_fee_paid) return t('paid');
    if (app.tuition_fee_proof_pending) return t('tuitionProofPending');
    const latest = app.latest_tuition_payment;
    if (latest?.status === 'failed') return t('feeProofRejected');
    return formatMoney(app.tuition_fee ?? 0);
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

          <ApplicationProgressBar progress={app.progress} compact />

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div><dt className="text-slate-400">{t('applicationFee')}</dt><dd>{feeStatusLabel(app)}</dd></div>
            <div><dt className="text-slate-400">{t('tuition')}</dt><dd>{tuitionStatusLabel(app)}</dd></div>
            <div><dt className="text-slate-400">{t('letterSent')}</dt><dd>{app.admission_letter_sent ? t('yes') : t('no')}</dd></div>
            <div><dt className="text-slate-400">{t('accepted')}</dt><dd>{app.admission_accepted ? t('yes') : t('no')}</dd></div>
          </dl>

          {app.latest_application_fee_payment?.review_notes && app.latest_application_fee_payment.status === 'failed' && (
            <p className="mt-3 text-sm text-red-600">{t('reason')}: {app.latest_application_fee_payment.review_notes}</p>
          )}

          {app.latest_tuition_payment?.review_notes && app.latest_tuition_payment.status === 'failed' && (
            <p className="mt-3 text-sm text-red-600">{t('reason')}: {app.latest_tuition_payment.review_notes}</p>
          )}

          {app.rejection_reason && (
            <p className="mt-3 text-sm text-red-600">{t('reason')}: {app.rejection_reason}</p>
          )}

          <div className="mt-4">
            <StudentApplicationActions
              app={app}
              actionId={actionId}
              onPayApplicationFee={(application) => openPayment(application, 'application_fee')}
              onPayTuition={(application) => openPayment(application, 'tuition')}
              onAcceptAdmission={handleAccept}
              onCancelApplication={handleCancel}
            />
          </div>
        </div>
      ))}

      <PaymentMethodModal
        application={paymentApp}
        paymentType={paymentType}
        open={!!paymentApp}
        onClose={() => setPaymentApp(null)}
        onSuccess={load}
      />
    </div>
  );
}
