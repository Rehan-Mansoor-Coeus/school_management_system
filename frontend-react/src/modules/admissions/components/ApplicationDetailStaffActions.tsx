import { useState } from 'react';
import type { Application } from '../types';
import {
  admitStudent,
  decideDepartmentApplication,
  reviewRegistryApplication,
  verifyTuition,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useAuth } from '../../../context/AuthContext';
import { hasFullAdmissionsAccess } from '../../../utils/accessControl';
import ApplicationReviewPanel from './ApplicationReviewPanel';

type Props = {
  application: Application;
  onUpdated: () => void;
};

export default function ApplicationDetailStaffActions({ application, onUpdated }: Props) {
  const { t } = useAdmissionsI18n();
  const { canAccess, permissions, userRoles } = useAuth();
  const fullAccess = hasFullAdmissionsAccess(permissions, userRoles);

  const canRegistry = fullAccess || canAccess({ permissions: ['admissions.registry.review'] });
  const canDepartment = fullAccess || canAccess({ permissions: ['admissions.department.review'] });
  const canRegistrar = fullAccess || canAccess({ permissions: ['admissions.registrar.admit'] });
  const canFinance = fullAccess || canAccess({ permissions: ['admissions.finance.verify'] });

  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);

  const registryReady = application.status === 'submitted' && application.application_fee_paid;
  const departmentReady = application.status === 'registry_reviewed';
  const registrarReady = application.status === 'department_approved';
  const financeReady = application.status === 'accepted' && application.admission_accepted && !application.tuition_fee_paid;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setComment('');
      setRejectionReason('');
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  if (registryReady && canRegistry) {
    return (
      <ApplicationReviewPanel
        title={t('registryReviewTitle')}
        hint={t('registrySelectHint')}
        comment={comment}
        onCommentChange={setComment}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onValidate={() => run(async () => {
          await reviewRegistryApplication(application.id, {
            decision: 'approved',
            admission_comment: comment || undefined,
          });
        })}
        onReject={() => {
          if (!rejectionReason.trim()) {
            window.alert(t('rejectionReasonRequired'));
            return;
          }
          run(async () => {
            await reviewRegistryApplication(application.id, {
              decision: 'rejected',
              admission_comment: comment || undefined,
              rejection_reason: rejectionReason,
            });
          });
        }}
        validateLabel={t('validate')}
        rejectLabel={t('reject')}
        busy={busy}
      />
    );
  }

  if (departmentReady && canDepartment) {
    return (
      <ApplicationReviewPanel
        title={t('departmentReview')}
        hint={t('departmentSelectHint')}
        comment={comment}
        onCommentChange={setComment}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onValidate={() => run(async () => {
          await decideDepartmentApplication(application.id, {
            status: 'approved',
            admission_comment: comment || undefined,
          });
        })}
        onReject={() => {
          if (!rejectionReason.trim()) {
            window.alert(t('rejectionReasonRequired'));
            return;
          }
          run(async () => {
            await decideDepartmentApplication(application.id, {
              status: 'rejected',
              admission_comment: comment || undefined,
              rejection_reason: rejectionReason,
            });
          });
        }}
        validateLabel={t('validate')}
        rejectLabel={t('reject')}
        busy={busy}
      />
    );
  }

  if (registrarReady && canRegistrar) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">{t('registrarReadyTitle')}</h3>
        <p className="mt-1 mb-4 text-sm text-slate-500">{t('registrarNoReady')}</p>
        <textarea
          className="mb-3 w-full rounded-lg border border-slate-200 p-2 text-sm"
          placeholder={t('commentOptional')}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => { await admitStudent(application.id); })}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t('admitAndSendLetter')}
        </button>
      </section>
    );
  }

  if (financeReady && canFinance) {
    return (
      <ApplicationReviewPanel
        title={t('financeTitle')}
        hint={t('financeSubtitle')}
        comment={comment}
        onCommentChange={setComment}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onValidate={() => run(async () => { await verifyTuition(application.id); })}
        onReject={() => setRejectionReason('')}
        validateLabel={t('validateAndGenerateReg')}
        rejectLabel={t('cancel')}
        busy={busy}
      />
    );
  }

  return null;
}
