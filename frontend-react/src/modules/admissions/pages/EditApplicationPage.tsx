import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProgrammeDocumentUploadList, {
  type ProgrammeRequiredDocument,
  type RequiredDocumentUpload,
} from '../components/ProgrammeDocumentUploadList';
import ApplicationAgreementSection from '../components/ApplicationAgreementSection';
import SignaturePad from '../../../components/letters/SignaturePad';
import {
  fetchAdmissionsReferenceData,
  fetchApplication,
  formatValidationError,
  updateApplication,
} from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { publicFileUrl } from '../../../utils/publicFileUrl';
import type { AdmissionAgreement, Application } from '../types';

interface Programme {
  id: number;
  name: string;
  code: string;
  required_documents?: ProgrammeRequiredDocument[];
  admission_agreement?: AdmissionAgreement | null;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

export default function EditApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useAdmissionsI18n();

  const [application, setApplication] = useState<Application | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [institutionAgreement, setInstitutionAgreement] = useState<AdmissionAgreement | null>(null);

  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [documentUploads, setDocumentUploads] = useState<RequiredDocumentUpload[]>([]);
  const [acceptedAgreementIds, setAcceptedAgreementIds] = useState<number[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');

  const selectedProgrammeData = useMemo(
    () => programmes.find((programme) => String(programme.id) === selectedProgramme),
    [programmes, selectedProgramme],
  );

  const activeAgreements = useMemo(() => {
    const list: AdmissionAgreement[] = [];
    if (institutionAgreement?.content?.trim()) {
      list.push(institutionAgreement);
    }
    if (selectedProgrammeData?.admission_agreement?.content?.trim()) {
      list.push(selectedProgrammeData.admission_agreement);
    }
    return list;
  }, [institutionAgreement, selectedProgrammeData]);

  useEffect(() => {
    if (!id) return;

    Promise.all([fetchApplication(Number(id)), fetchAdmissionsReferenceData()])
      .then(([app, reference]) => {
        if (!app.can_update) {
          setError(t('cannotUpdateApplication'));
          return;
        }
        setApplication(app);
        setProgrammes((reference.programmes as Programme[]) || []);
        setAcademicYears((reference.academic_years as AcademicYear[]) || []);
        setInstitutionAgreement((reference.institution_agreement as AdmissionAgreement) || null);
        setSelectedProgramme(String(app.programme?.id || ''));
        setSelectedAcademicYear(String(app.academic_year?.id || ''));
        setAcceptedAgreementIds(app.accepted_agreement_ids || []);
      })
      .catch(() => setError(t('applicationNotFound')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    const requirements = selectedProgrammeData?.required_documents || [];
    setDocumentUploads(
      requirements.map((requirement) => {
        const existing = application?.documents?.find(
          (doc) => doc.programme_required_document_id === requirement.id,
        );
        return {
          requiredDocumentId: requirement.id,
          name: requirement.name,
          description: requirement.description,
          is_required: requirement.is_required,
          comment: existing?.comment || '',
          existingDocumentId: existing?.id,
          existingFileName: existing?.document_name,
          existingUrl: existing?.url,
          existingMimeType: existing?.mime_type,
        };
      }),
    );
  }, [selectedProgrammeData, application]);

  const toggleAgreement = (agreementId: number, accepted: boolean) => {
    setAcceptedAgreementIds((current) =>
      accepted ? [...current, agreementId] : current.filter((value) => value !== agreementId),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!application?.id) return;

    const missingAgreement = activeAgreements.some(
      (agreement) => agreement.is_required && !acceptedAgreementIds.includes(agreement.id),
    );
    if (missingAgreement) {
      setLocalError(t('agreementsRequired'));
      return;
    }

    setSaving(true);
    setError('');
    setLocalError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('academic_year_id', selectedAcademicYear);
      formData.append('programme_id', selectedProgramme);

      let uploadIndex = 0;
      documentUploads.forEach((row) => {
        if (!row.file) return;
        formData.append(`required_document_ids[${uploadIndex}]`, String(row.requiredDocumentId));
        formData.append(`required_documents[${uploadIndex}]`, row.file);
        if (row.comment.trim()) {
          formData.append(`document_comments[${uploadIndex}]`, row.comment.trim());
        }
        uploadIndex += 1;
      });

      let deleteIndex = 0;
      documentUploads.forEach((row) => {
        if (row.removed && row.existingDocumentId) {
          formData.append(`deleted_document_ids[${deleteIndex}]`, String(row.existingDocumentId));
          deleteIndex += 1;
        }
      });

      acceptedAgreementIds.forEach((agreementId, index) => {
        formData.append(`accepted_agreement_ids[${index}]`, String(agreementId));
      });

      if (signatureDataUrl) {
        const [header, base64] = signatureDataUrl.split(',');
        const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        formData.append('applicant_signature', new File([bytes], 'signature.png', { type: mime }));
      }

      await updateApplication(application.id, formData, setUploadProgress);
      navigate(`/admissions/my-applications/${application.id}`);
    } catch (err: unknown) {
      setError(formatValidationError(err, t('errorUpdateApplication')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">{t('loading')}</p>;
  }

  if (error && !application) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-red-600">{error}</p>
        <Link to="/admissions/my-applications" className="mt-4 inline-block text-[#1e3a5f] hover:underline">
          {t('backToApplications')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link to={`/admissions/my-applications/${application?.id}`} className="text-sm text-[#1e3a5f] hover:underline">
          {t('backToApplications')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{t('editApplication')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('editApplicationHint')}</p>
      </div>

      {(error || localError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error || localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t('academicYear')} *</label>
          <select
            value={selectedAcademicYear}
            onChange={(event) => setSelectedAcademicYear(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">{t('selectAcademicYear')}</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.is_current ? `(${t('current')})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t('programme')} *</label>
          <select
            value={selectedProgramme}
            onChange={(event) => setSelectedProgramme(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">{t('selectProgrammeOption')}</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name} ({programme.code})
              </option>
            ))}
          </select>
        </div>

        {selectedProgramme && (
          <>
            <ProgrammeDocumentUploadList
              requirements={selectedProgrammeData?.required_documents || []}
              uploads={documentUploads}
              onChange={setDocumentUploads}
              submitProgress={uploadProgress}
              submitting={saving}
              allowDelete
            />
            <p className="text-xs text-slate-500">{t('keepExistingDocumentsHint')}</p>

            {activeAgreements.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('applicationAgreements')}</h3>
                <ApplicationAgreementSection
                  agreements={activeAgreements}
                  acceptedIds={acceptedAgreementIds}
                  onToggle={toggleAgreement}
                />
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('applicantSignature')}</h3>
              <p className="mb-3 text-xs text-slate-500">{t('updateSignatureHint')}</p>
              {application?.applicant_signature_url && !signatureDataUrl && (
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">{t('currentSignature')}</p>
                  <img
                    src={publicFileUrl(application.applicant_signature_url) || application.applicant_signature_url}
                    alt={t('applicantSignature')}
                    className="h-20 object-contain"
                  />
                </div>
              )}
              <SignaturePad
                label={t('applicantSignature')}
                value={signatureDataUrl}
                onConfirm={setSignatureDataUrl}
              />
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Link
            to={`/admissions/my-applications/${application?.id}`}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving || !selectedProgramme}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
