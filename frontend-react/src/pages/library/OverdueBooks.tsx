import { useEffect, useState } from 'react'
import { AlarmClock, Undo2, Bell } from 'lucide-react'
import { fetchOverdueBooks, returnBorrowRequest, sendBorrowReminder, type BorrowRequest } from '../../api/library'
import { Button, EmptyState, PageHeader, Spinner, TableWrap, tdClass, thClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'

export default function OverdueBooks() {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BorrowRequest[]>([])

  const canReturn = hasPermission('return_books')
  const canRemind = hasPermission('send_library_reminders')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchOverdueBooks()
      setRows(res.data)
    } catch {
      pushToast('Failed to load overdue books', 'error')
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
      <PageHeader title="Overdue Books" subtitle="Books past their return date" icon={AlarmClock} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No overdue books. Great!" />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Copy</th>
              <th className={thClass}>Return by</th>
              <th className={thClass}>Overdue</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{r.user_name}</td>
                <td className={tdClass}>{r.user_phone || '—'}</td>
                <td className={tdClass}>{r.book_title}</td>
                <td className={tdClass}>{r.copy_code || '—'}</td>
                <td className={tdClass}>{r.expected_return_date || '—'}</td>
                <td className={tdClass}><span className="font-medium text-rose-600">{r.overdue_days || 0}d</span></td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {canRemind && <Button variant="secondary" onClick={() => act(() => sendBorrowReminder(r.id), 'Overdue reminder sent')}><Bell className="h-4 w-4" /> Remind</Button>}
                    {canReturn && <Button onClick={() => act(() => returnBorrowRequest(r.id), 'Marked returned')}><Undo2 className="h-4 w-4" /> Return</Button>}
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
