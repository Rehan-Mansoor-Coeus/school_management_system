import { Link } from 'react-router-dom';
import type { Application } from '../types';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

type Props = {
  app: Application;
  actionId: number | null;
  onPayApplicationFee: (app: Application) => void;
  onPayTuition: (app: Application) => void;
  onAcceptAdmission: (appId: number) => void;
  showViewDetails?: boolean;
};

export default function StudentApplicationActions({
  app,
  actionId,
  onPayApplicationFee,
  onPayTuition,
  onAcceptAdmission,
  showViewDetails = true,
}: Props) {
  const { t } = useAdmissionsI18n();
  const { formatMoney } = useFormatMoney();
  const tuitionAmount = Number(app.tuition_fee ?? 0);
  const showAccept = app.can_accept_admission ?? (app.status === 'admitted' && !app.admission_accepted);
  const showPayTuition = app.can_pay_tuition ?? (app.status === 'accepted' && !app.tuition_fee_paid && tuitionAmount > 0);
  const showPayAppFee = app.can_pay_application_fee ?? (app.status === 'submitted' && !app.application_fee_paid && !app.application_fee_proof_pending);
  const tuitionPending = app.tuition_fee_proof_pending;
  const awaitingTuitionAfterAccept = app.status === 'accepted' && !app.tuition_fee_paid && tuitionAmount <= 0;

  return (
    <div className="space-y-3">
      {showAccept && tuitionAmount > 0 && (
        <p className="text-sm text-slate-600">
          {t('acceptAdmissionToPayTuition').replace(':amount', formatMoney(tuitionAmount))}
        </p>
      )}

      {awaitingTuitionAfterAccept && (
        <p className="text-sm text-amber-700">{t('tuitionFeeNotSet')}</p>
      )}

      {tuitionPending && (
        <p className="text-sm text-amber-700">{t('tuitionProofPending')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {showViewDetails && (
          <Link
            to={`/admissions/my-applications/${app.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('viewDetails')}
          </Link>
        )}
        {showPayAppFee && (
          <button
            type="button"
            disabled={actionId === app.id}
            onClick={() => onPayApplicationFee(app)}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a73] disabled:opacity-50"
          >
            {t('payApplicationFee')}
          </button>
        )}
        {showAccept && (
          <button
            type="button"
            disabled={actionId === app.id}
            onClick={() => onAcceptAdmission(app.id)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {t('acceptAdmission')}
          </button>
        )}
        {showPayTuition && !tuitionPending && (
          <button
            type="button"
            disabled={actionId === app.id}
            onClick={() => onPayTuition(app)}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a73] disabled:opacity-50"
          >
            {t('payTuition')} ({formatMoney(tuitionAmount)})
          </button>
        )}
        {app.status === 'enrolled' && (
          <a href="/admissions/courses" className="rounded-lg border border-[#1e3a5f] px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-50">
            {t('registerCoursesLink')}
          </a>
        )}
      </div>
    </div>
  );
}
