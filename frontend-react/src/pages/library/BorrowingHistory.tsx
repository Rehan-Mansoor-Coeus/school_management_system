import { useEffect, useState } from 'react'
import { History, Star } from 'lucide-react'
import { fetchBorrowingHistory, createBookReview, type BorrowRequest } from '../../api/library'
import { Button, EmptyState, Field, PageHeader, Spinner, StatusBadge, TableWrap, inputClass, tdClass, thClass } from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'

export default function BorrowingHistory() {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BorrowRequest[]>([])
  const [reviewTarget, setReviewTarget] = useState<BorrowRequest | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const canRate = hasPermission('rate_books') || hasPermission('comment_on_books')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchBorrowingHistory()
      setRows(res.data)
    } catch {
      pushToast('Failed to load history', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openReview(r: BorrowRequest) {
    setReviewTarget(r)
    setRating(5)
    setComment('')
  }

  async function submitReview() {
    if (!reviewTarget) return
    setBusy(true)
    try {
      await createBookReview(reviewTarget.book_id, { rating, comment: comment || undefined })
      pushToast('Thanks for your review!', 'success')
      setReviewTarget(null)
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to submit review', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Borrowing History" subtitle="Your borrowing records" icon={History} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No borrowing history yet." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Borrowed</th>
              <th className={thClass}>Returned</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{r.user_name}</td>
                <td className={tdClass}>{r.book_title}</td>
                <td className={tdClass}>{r.issued_at?.slice(0, 10) || '—'}</td>
                <td className={tdClass}>{r.returned_at?.slice(0, 10) || '—'}</td>
                <td className={tdClass}><StatusBadge status={r.status} /></td>
                <td className={tdClass}>
                  {r.status === 'returned' && canRate ? (
                    <Button variant="secondary" onClick={() => openReview(r)}><Star className="h-4 w-4" /> Rate</Button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        title={`Review: ${reviewTarget?.book_title || ''}`}
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button onClick={submitReview} disabled={busy}>{busy ? 'Submitting…' : 'Submit Review'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Rating">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'text-amber-500' : 'text-slate-300'}`}>
                  ★
                </button>
              ))}
            </div>
          </Field>
          <Field label="Comment">
            <textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts (visible to other users)" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
