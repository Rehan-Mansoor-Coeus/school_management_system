import { useEffect, useState } from 'react'
import { BookOpenCheck, Undo2, Bell, AlertTriangle } from 'lucide-react'
import { fetchBorrowedBooks, returnBorrowRequest, sendBorrowReminder, markLostOrDamaged, type BorrowRequest } from '../../api/library'
import { Button, EmptyState, PageHeader, Spinner, StatusBadge, TableWrap, tdClass, thClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'

function daysLabel(r: BorrowRequest) {
  if (r.days_remaining === null || r.days_remaining === undefined) return '—'
  if (r.days_remaining < 0) return <span className="font-medium text-rose-600">{Math.abs(r.days_remaining)}d overdue</span>
  return <span className="text-slate-600">{r.days_remaining}d left</span>
}

export default function BorrowedBooks() {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BorrowRequest[]>([])

  const canReturn = hasPermission('return_books')
  const canRemind = hasPermission('send_library_reminders')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchBorrowedBooks()
      setRows(res.data)
    } catch {
      pushToast('Failed to load borrowed books', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function act(fn: () => Promise<any>, msg: string) {
    try {
      await fn()
      pushToast(msg, 'success')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Action failed', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Borrowed Books" subtitle="Books currently signed out" icon={BookOpenCheck} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No books are currently borrowed." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Copy</th>
              <th className={thClass}>Issued</th>
              <th className={thClass}>Return by</th>
              <th className={thClass}>Remaining</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{r.user_name}</td>
                <td className={tdClass}>{r.book_title}</td>
                <td className={tdClass}>{r.copy_code || '—'}</td>
                <td className={tdClass}>{r.issued_at?.slice(0, 10) || '—'}</td>
                <td className={tdClass}>{r.expected_return_date || '—'}</td>
                <td className={tdClass}>{daysLabel(r)}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {canReturn && <Button onClick={() => act(() => returnBorrowRequest(r.id), 'Marked returned')}><Undo2 className="h-4 w-4" /> Return</Button>}
                    {canRemind && <Button variant="secondary" onClick={() => act(() => sendBorrowReminder(r.id), 'Reminder sent')}><Bell className="h-4 w-4" /></Button>}
                    {canReturn && (
                      <Button variant="ghost" className="text-rose-600" onClick={() => {
                        const c = window.confirm('Mark as LOST? Click Cancel to mark as DAMAGED instead.')
                        act(() => markLostOrDamaged(r.id, c ? 'lost' : 'damaged'), 'Copy updated')
                      }}><AlertTriangle className="h-4 w-4" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
