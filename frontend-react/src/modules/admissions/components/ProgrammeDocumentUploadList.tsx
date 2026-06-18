import { useEffect, useMemo } from 'react';
import { Trash2, Upload } from 'lucide-react';
import UploadProgressBar from '../../../components/ui/UploadProgressBar';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { publicFileUrl } from '../../../utils/publicFileUrl';

export type ProgrammeRequiredDocument = {
  id: number;
  name: string;
  description?: string | null;
  is_required: boolean;
  sort_order: number;
};

export type RequiredDocumentUpload = {
  requiredDocumentId: number;
  name: string;
  description?: string | null;
  is_required: boolean;
  file?: File;
  comment: string;
  existingDocumentId?: number;
  existingFileName?: string;
  existingUrl?: string | null;
  existingMimeType?: string | null;
  removed?: boolean;
};

type Props = {
  requirements: ProgrammeRequiredDocument[];
  uploads: RequiredDocumentUpload[];
  onChange: (uploads: RequiredDocumentUpload[]) => void;
  submitProgress?: number;
  submitting?: boolean;
  allowDelete?: boolean;
};

function isImageType(mime?: string | null, fileName?: string) {
  if (mime?.startsWith('image/')) return true;
  const name = (fileName || '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some((ext) => name.endsWith(ext));
}

function isPdfType(mime?: string | null, fileName?: string) {
  if (mime === 'application/pdf') return true;
  return (fileName || '').toLowerCase().endsWith('.pdf');
}

function DocumentPreview({
  src,
  fileName,
  mimeType,
  viewLabel,
}: {
  src: string;
  fileName?: string;
  mimeType?: string | null;
  viewLabel: string;
}) {
  if (isImageType(mimeType, fileName)) {
    return (
      <img
        src={src}
        alt={fileName || 'Document preview'}
        className="max-h-48 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
      />
    );
  }

  if (isPdfType(mimeType, fileName)) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-100"
      >
        {viewLabel}
      </a>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-100"
    >
      {viewLabel}
    </a>
  );
}

export default function ProgrammeDocumentUploadList({
  requirements,
  uploads,
  onChange,
  submitProgress = 0,
  submitting = false,
  allowDelete = false,
}: Props) {
  const { t } = useAdmissionsI18n();

  const previewUrls = useMemo(() => {
    const map = new Map<number, string>();
    uploads.forEach((row) => {
      if (row.file) {
        map.set(row.requiredDocumentId, URL.createObjectURL(row.file));
      }
    });
    return map;
  }, [uploads]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const updateUpload = (requiredDocumentId: number, patch: Partial<RequiredDocumentUpload>) => {
    onChange(uploads.map((row) => (row.requiredDocumentId === requiredDocumentId ? { ...row, ...patch } : row)));
  };

  const removeUpload = (requiredDocumentId: number) => {
    const row = uploads.find((item) => item.requiredDocumentId === requiredDocumentId);
    if (!row) return;

    if (row.file) {
      updateUpload(requiredDocumentId, { file: undefined });
      return;
    }

    if (row.existingDocumentId) {
      updateUpload(requiredDocumentId, {
        removed: true,
        existingFileName: undefined,
        existingUrl: undefined,
        existingMimeType: undefined,
      });
    }
  };

  if (requirements.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {t('noProgrammeDocumentsRequired')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('programmeRequiredDocuments')}</label>
        <p className="mt-1 text-xs text-slate-500">{t('programmeRequiredDocumentsHint')}</p>
      </div>

      {requirements.map((requirement) => {
        const upload = uploads.find((row) => row.requiredDocumentId === requirement.id);
        if (!upload) {
          return null;
        }

        const selectedPreviewUrl = upload.file ? previewUrls.get(requirement.id) : undefined;
        const existingPreviewUrl = !upload.removed && upload.existingUrl
          ? publicFileUrl(upload.existingUrl) || upload.existingUrl
          : undefined;
        const previewUrl = selectedPreviewUrl || existingPreviewUrl;
        const previewFileName = upload.file?.name || upload.existingFileName;
        const previewMimeType = upload.file?.type || upload.existingMimeType;
        const hasDocument = Boolean(upload.file || (existingPreviewUrl && !upload.removed));
        const inputKey = `${requirement.id}-${upload.removed ? 'removed' : 'active'}-${upload.file?.name || upload.existingDocumentId || 'empty'}`;

        return (
          <div key={requirement.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-800">{requirement.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  requirement.is_required
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {requirement.is_required ? t('mandatoryDocument') : t('optionalDocument')}
              </span>
            </div>

            {requirement.description && (
              <p className="mb-3 text-sm text-slate-500">{requirement.description}</p>
            )}

            {previewUrl && (
              <div className="mb-3 space-y-2">
                <DocumentPreview
                  src={previewUrl}
                  fileName={previewFileName}
                  mimeType={previewMimeType}
                  viewLabel={t('viewDocument')}
                />
                {previewFileName && (
                  <p className="text-xs text-slate-500">{previewFileName}</p>
                )}
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px] border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  key={inputKey}
                  type="file"
                  id={`required-doc-${requirement.id}`}
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateUpload(requirement.id, {
                        file,
                        removed: false,
                      });
                    }
                  }}
                />
                <label htmlFor={`required-doc-${requirement.id}`} className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload size={22} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {upload.file
                      ? upload.file.name
                      : hasDocument
                      ? t('uploadReplacement')
                      : t('uploadHint')}
                  </span>
                </label>
              </div>

              {allowDelete && hasDocument && (
                <button
                  type="button"
                  onClick={() => removeUpload(requirement.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  {t('deleteDocument')}
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">{t('documentComment')}</label>
              <textarea
                value={upload.comment}
                onChange={(e) => updateUpload(requirement.id, { comment: e.target.value })}
                rows={2}
                placeholder={t('documentCommentPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {submitting && upload.file && (
              <div className="mt-3">
                <UploadProgressBar progress={submitProgress} label={upload.file.name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
