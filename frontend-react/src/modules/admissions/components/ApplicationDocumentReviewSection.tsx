import { useMemo, useState } from 'react';
import { publicFileUrl } from '../../../utils/publicFileUrl';
import { reviewApplicationDocument } from '../../../api/admissions';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import type { ApplicationDocument } from '../types';

type Props = {
  documents: ApplicationDocument[];
  onUpdated?: () => void;
  canReview?: boolean;
};

export default function ApplicationDocumentReviewSection({ documents, onUpdated, canReview = true }: Props) {
  const { t } = useAdmissionsI18n();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const pendingDocuments = useMemo(
    () => documents.filter((doc) => doc.review_status !== 'approved' && doc.review_status !== 'rejected'),
    [documents],
  );

  if (!documents.length) {
    return null;
  }

  const submitReview = async (documentId: number, decision: 'approved' | 'rejected', comment = reviewComment) => {
    if (decision === 'rejected' && !comment.trim()) {
      return;
    }

    setBusyId(documentId);
    try {
      await reviewApplicationDocument(documentId, {
        decision,
        review_comment: comment.trim() || undefined,
      });
      setActiveId(null);
      setReviewComment('');
      setSelectedIds((current) => current.filter((id) => id !== documentId));
      onUpdated?.();
    } finally {
      setBusyId(null);
    }
  };

  const reviewMany = async (ids: number[], decision: 'approved' | 'rejected') => {
    if (!ids.length) return;
    if (decision === 'rejected' && !reviewComment.trim()) return;

    setBusyId(-1);
    try {
      for (const documentId of ids) {
        await reviewApplicationDocument(documentId, {
          decision,
          review_comment: reviewComment.trim() || undefined,
        });
      }
      setSelectedIds([]);
      setBulkRejectOpen(false);
      setReviewComment('');
      onUpdated?.();
    } finally {
      setBusyId(null);
    }
  };

  const statusBadge = (status?: string) => {
    if (status === 'approved') {
      return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{t('documentApproved')}</span>;
    }
    if (status === 'rejected') {
      return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{t('documentRejected')}</span>;
    }
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{t('documentPending')}</span>;
  };

  const allPendingSelected = pendingDocuments.length > 0
    && pendingDocuments.every((doc) => selectedIds.includes(doc.id));

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="font-semibold text-slate-900">{t('documentReviewTitle')}</h3>
        <p className="mt-1 text-sm text-slate-500">{t('documentReviewHint')}</p>
      </div>

      {canReview && pendingDocuments.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={(event) => setSelectedIds(event.target.checked ? pendingDocuments.map((doc) => doc.id) : [])}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t('documentSelectAll')}
          </label>
          <button
            type="button"
            disabled={!selectedIds.length || busyId !== null}
            onClick={() => reviewMany(selectedIds, 'approved')}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {t('approveSelectedDocuments')}
          </button>
          <button
            type="button"
            disabled={!selectedIds.length || busyId !== null}
            onClick={() => setBulkRejectOpen(true)}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {t('rejectSelectedDocuments')}
          </button>
        </div>
      )}

      {bulkRejectOpen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            rows={2}
            placeholder={t('reviewCommentPlaceholder')}
            className="mb-2 w-full rounded-lg border border-rose-200 p-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!reviewComment.trim() || busyId !== null}
              onClick={() => reviewMany(selectedIds, 'rejected')}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {t('rejectSelectedDocuments')}
            </button>
            <button
              type="button"
              onClick={() => { setBulkRejectOpen(false); setReviewComment(''); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-3">
              {canReview && doc.review_status !== 'approved' && doc.review_status !== 'rejected' && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={(event) => setSelectedIds((current) => (
                    event.target.checked
                      ? [...current, doc.id]
                      : current.filter((id) => id !== doc.id)
                  ))}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
              )}
              <div>
                <div className="font-medium text-slate-800">{doc.document_name}</div>
                {doc.comment && (
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-medium">{t('applicantDocumentComment')}:</span> {doc.comment}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(doc.review_status)}
              {doc.url && (
                <a href={publicFileUrl(doc.url) || doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1e3a5f] hover:underline">
                  {t('viewDocument')}
                </a>
              )}
            </div>
          </div>

          {doc.review_comment && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-medium">{t('reviewComment')}:</span> {doc.review_comment}
            </p>
          )}

          {canReview && doc.review_status !== 'approved' && doc.review_status !== 'rejected' && (
            <div className="mt-3 space-y-2">
              {activeId === doc.id ? (
                <>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={2}
                    placeholder={t('reviewCommentPlaceholder')}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === doc.id}
                      onClick={() => submitReview(doc.id, 'approved')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      {t('approveDocument')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === doc.id || !reviewComment.trim()}
                      onClick={() => submitReview(doc.id, 'rejected')}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      {t('rejectDocument')}
                    </button>
                    <button type="button" onClick={() => { setActiveId(null); setReviewComment(''); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                      {t('cancel')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === doc.id}
                    onClick={() => submitReview(doc.id, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {t('approveDocument')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveId(doc.id); setReviewComment(''); }}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white"
                  >
                    {t('rejectDocument')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
