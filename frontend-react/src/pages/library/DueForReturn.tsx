import { useEffect, useState } from 'react'
import { CalendarClock, Undo2, Bell, Send } from 'lucide-react'
import { fetchDueForReturn, returnBorrowRequest, sendBorrowReminder, sendBulkReminders, type BorrowRequest } from '../../api/library'
import { Button, Card, EmptyState, PageHeader, Spinner, TableWrap, inputClass, tdClass, thClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'

export default function DueForReturn() {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BorrowRequest[]>([])
  const [days, setDays] = useState(3)
  const [selected, setSelected] = useState<number[]>([])

  const canReturn = hasPermission('return_books')
  const canRemind = hasPermission('send_library_reminders')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchDueForReturn({ days })
      setRows(res.data)
      setSelected([])
    } catch {
      pushToast('Failed to load due list', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [days])

  function toggle(id: number) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function toggleAll() {
    setSelected((cur) => (cur.length === rows.length ? [] : rows.map((r) => r.id)))
  }

  async function act(fn: () => Promise<any>, msg: string) {
    try {
      await fn()
      pushToast(msg, 'success')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Action failed', 'error')
    }
  }

  async function bulkRemind() {
    if (selected.length === 0) return
    await act(() => sendBulkReminders(selected), `Reminders sent to ${selected.length}`)
  }

  return (
    <div>
      <PageHeader
        title="Due for Return"
        subtitle="Books due today or soon"
        icon={CalendarClock}
        actions={
          canRemind ? (
            <Button onClick={bulkRemind} disabled={selected.length === 0}>
              <Send className="h-4 w-4" /> Send WhatsApp Reminder ({selected.length})
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <label className="flex items-center gap-3 text-sm text-slate-600">
          Show books due within
          <input type="number" min={0} className={`${inputClass} w-20`} value={days} onChange={(e) => setDays(parseInt(e.target.value || '0', 10))} />
          days
        </label>
      </Card>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No books are due in this window." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              {canRemind && (
                <th className={thClass}>
                  <input type="checkbox" className="h-4 w-4 accent-[#1e3a5f]" checked={selected.length === rows.length} onChange={toggleAll} />
                </th>
              )}
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Phone</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Copy</th>
              <th className={thClass}>Return by</th>
              <th className={thClass}>Days left</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {canRemind && (
                  <td className={tdClass}>
                    <input type="checkbox" className="h-4 w-4 accent-[#1e3a5f]" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                )}
                <td className={`${tdClass} font-medium text-slate-800`}>{r.user_name}</td>
                <td className={tdClass}>{r.user_phone || '—'}</td>
                <td className={tdClass}>{r.book_title}</td>
                <td className={tdClass}>{r.copy_code || '—'}</td>
                <td className={tdClass}>{r.expected_return_date || '—'}</td>
                <td className={tdClass}>{r.days_remaining ?? '—'}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {canRemind && <Button variant="secondary" onClick={() => act(() => sendBorrowReminder(r.id), 'Reminder sent')}><Bell className="h-4 w-4" /></Button>}
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
