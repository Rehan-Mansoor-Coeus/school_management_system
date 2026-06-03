import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Application } from '../types';
import { fetchApplication, resendAdmissionLetter } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { statusLabelKey } from '../../../i18n/admissions';
import { useAuth } from '../../../context/AuthContext';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

const RESEND_LETTER_STATUSES = ['admitted', 'accepted', 'tuition_paid', 'enrolled'] as const;

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useAdmissionsI18n();
  const { canAccess } = useAuth();
  const isStaffViewer = canAccess({ permissions: ['admissions.view', 'admissions.manage'] });
  const canResendLetter = canAccess({ permissions: ['admissions.registrar.admit', 'admissions.manage'] });
  const backPath = isStaffViewer ? '/admissions/applications' : '/admissions/my-applications';
  const backLabel = isStaffViewer ? t('backToAllApplications') : t('backToApplications');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchApplication(Number(id))
      .then((data) => {
        if (!cancelled) setApplication(data);
      })
      .catch(() => {
        if (!cancelled) setError('applicationNotFound');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-slate-500">{t('loadingApplications')}</p>;
  if (error || !application) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error ? t(error) : t('applicationNotFound')}</p>
        <Link to={backPath} className="text-[#1e3a5f] hover:underline">{backLabel}</Link>
      </div>
    );
  }

  const applicant = application.applicant;
  const statusKey = statusLabelKey(application.status);
  const showResendLetter = canResendLetter && RESEND_LETTER_STATUSES.includes(application.status as typeof RESEND_LETTER_STATUSES[number]);

  const handleResendLetter = async () => {
    if (!application) return;
    setResending(true);
    setResendMessage('');
    setResendError('');
    try {
      const res = await resendAdmissionLetter(application.id);
      if (res.data) {
        setApplication(res.data);
      }
      setResendMessage(res.message || t('letterResentSuccess'));
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setResendError(payload?.message || t('letterWhatsappFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={backPath} className="text-sm text-[#1e3a5f] hover:underline">{backLabel}</Link>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{t('applicationDetails')}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{t(statusKey)}</span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">{t('applicationSummary')}</h3>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
          <DetailRow label={t('applicationNumber')} value={application.application_number} />
          <DetailRow label={t('programme')} value={application.programme?.name} />
          <DetailRow label={t('academicYear')} value={application.academic_year?.name} />
          <DetailRow label={t('applicationFee')} value={application.application_fee_paid ? t('paid') : `₦${application.application_fee}`} />
          <DetailRow label={t('tuition')} value={application.tuition_fee_paid ? t('paid') : `₦${application.tuition_fee ?? 0}`} />
          <DetailRow label={t('letterSent')} value={application.admission_letter_sent ? t('yes') : t('no')} />
          <DetailRow label={t('accepted')} value={application.admission_accepted ? t('yes') : t('no')} />
          <DetailRow label={t('submittedAt')} value={application.created_at} />
          {application.rejection_reason && <DetailRow label={t('reason')} value={application.rejection_reason} />}
          {application.admission_comment && <DetailRow label={t('comment')} value={application.admission_comment} />}
        </dl>
      </section>

      {showResendLetter && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-2">{t('admissionLetterSection')}</h3>
          <p className="text-sm text-slate-500 mb-4">{t('admissionLetterResendHint')}</p>
          {resendMessage && <p className="mb-3 text-sm text-green-700">{resendMessage}</p>}
          {resendError && <p className="mb-3 text-sm text-red-600">{resendError}</p>}
          <button
            type="button"
            onClick={handleResendLetter}
            disabled={resending}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a73] disabled:opacity-50"
          >
            {resending ? t('resendingLetter') : t('resendAdmissionLetter')}
          </button>
        </section>
      )}

      {applicant && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{t('personalInformation')}</h3>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            <DetailRow label={t('firstName')} value={applicant.first_name} />
            <DetailRow label={t('lastName')} value={applicant.last_name} />
            <DetailRow label={t('middleName')} value={applicant.middle_name} />
            <DetailRow label={t('email')} value={applicant.email} />
            <DetailRow label={t('phone')} value={applicant.phone} />
            <DetailRow label={t('gender')} value={applicant.gender} />
            <DetailRow label={t('dateOfBirth')} value={applicant.date_of_birth} />
            <DetailRow label={t('nationality')} value={applicant.nationality} />
            <DetailRow label={t('idNumber')} value={applicant.id_number} />
            <DetailRow label={t('address')} value={applicant.address} />
            <DetailRow label={t('city')} value={applicant.city} />
            <DetailRow label={t('state')} value={applicant.state} />
            <DetailRow label={t('country')} value={applicant.country} />
            <DetailRow label={t('internationalStudent')} value={applicant.is_international ? t('yes') : t('no')} />
          </dl>
        </section>
      )}

      {applicant && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{t('uploadedDocuments')}</h3>
          {!applicant.passport_url && !applicant.transcript_url ? (
            <p className="text-sm text-slate-500">{t('noDocumentsUploaded')}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {applicant.passport_url && (
                <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <span className="font-medium text-slate-800">{t('passportId')}</span>
                  <a href={applicant.passport_url} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline">
                    {t('viewDocument')}
                  </a>
                </li>
              )}
              {applicant.transcript_url && (
                <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <span className="font-medium text-slate-800">{t('academicTranscript')}</span>
                  <a href={applicant.transcript_url} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline">
                    {t('viewDocument')}
                  </a>
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">{t('applicationTimeline')}</h3>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <DetailRow label={t('submittedAt')} value={application.created_at} />
          <DetailRow label={t('registryReviewedAt')} value={application.registry_reviewed_at} />
          <DetailRow label={t('departmentReviewedAt')} value={application.department_reviewed_at} />
          <DetailRow label={t('admittedAt')} value={application.admitted_at} />
          <DetailRow label={t('admissionAcceptedAt')} value={application.admission_accepted_at} />
          <DetailRow label={t('tuitionVerifiedAt')} value={application.tuition_verified_at} />
        </dl>
      </section>
    </div>
  );
}
