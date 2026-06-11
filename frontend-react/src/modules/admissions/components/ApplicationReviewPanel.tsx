type Props = {
  title: string
  hint: string
  comment: string
  onCommentChange: (value: string) => void
  rejectionReason: string
  onRejectionReasonChange: (value: string) => void
  onValidate: () => void
  onReject: () => void
  validateLabel?: string
  rejectLabel?: string
  busy?: boolean
}

export default function ApplicationReviewPanel({
  title,
  hint,
  comment,
  onCommentChange,
  rejectionReason,
  onRejectionReasonChange,
  onValidate,
  onReject,
  validateLabel = 'Validate',
  rejectLabel = 'Reject',
  busy = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-sm text-slate-500">{hint}</p>
      <label className="mb-1 block text-sm font-medium text-slate-700">Comment</label>
      <textarea
        className="mb-3 w-full rounded-lg border border-slate-200 p-2 text-sm"
        placeholder="Add a comment for the applicant (optional)"
        rows={3}
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
      />
      <label className="mb-1 block text-sm font-medium text-slate-700">Rejection reason</label>
      <textarea
        className="mb-4 w-full rounded-lg border border-slate-200 p-2 text-sm"
        placeholder="Required only if rejecting"
        rows={2}
        value={rejectionReason}
        onChange={(e) => onRejectionReasonChange(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onValidate}
          className="flex-1 rounded-lg bg-[#1e3a5f] py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {validateLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {rejectLabel}
        </button>
      </div>
    </div>
  )
}
