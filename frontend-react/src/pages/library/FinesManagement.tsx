import { useEffect, useState } from 'react'
import { CircleDollarSign, Check, Ban } from 'lucide-react'
import { fetchLibraryFines, payLibraryFine, waiveLibraryFine, type LibraryFine } from '../../api/library'
import { Button, EmptyState, PageHeader, Spinner, StatusBadge, TableWrap, tdClass, thClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'
import { ColoredTabsBar, type TabColor } from '../../components/ui/ColoredModuleTabsNav'

const TABS: { id: string; color: TabColor }[] = [
  { id: 'unpaid', color: 'amber' },
  { id: 'paid', color: 'emerald' },
  { id: 'waived', color: 'purple' },
  { id: 'all', color: 'navy' },
]

export default function FinesManagement() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<LibraryFine[]>([])
  const [tab, setTab] = useState('unpaid')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchLibraryFines({ status: tab === 'all' ? undefined : tab })
      setRows(res.data)
    } catch {
      pushToast('Failed to load fines', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tab])

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
      <PageHeader title="Fines Management" subtitle="Track and settle library fines" icon={CircleDollarSign} />

      <div className="mb-4">
        <ColoredTabsBar
          items={TABS.map((s) => ({
            id: s.id,
            label: s.id.charAt(0).toUpperCase() + s.id.slice(1),
            color: s.color,
          }))}
          activeId={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No fines found." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Overdue Days</th>
              <th className={thClass}>Amount</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Payment Date</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{f.user_name}</td>
                <td className={tdClass}>{f.book_title || '—'}</td>
                <td className={tdClass}>{f.overdue_days}</td>
                <td className={`${tdClass} font-semibold`}>{Number(f.fine_amount).toFixed(2)}</td>
                <td className={tdClass}><StatusBadge status={f.status} /></td>
                <td className={tdClass}>{f.payment_date?.slice(0, 10) || '—'}</td>
                <td className={tdClass}>
                  {f.status === 'unpaid' ? (
                    <div className="flex flex-wrap gap-1">
                      <Button onClick={() => act(() => payLibraryFine(f.id), 'Marked paid')}><Check className="h-4 w-4" /> Paid</Button>
                      <Button variant="secondary" onClick={() => {
                        const c = window.prompt('Waive comment (optional):') || ''
                        act(() => waiveLibraryFine(f.id, c), 'Fine waived')
                      }}><Ban className="h-4 w-4" /> Waive</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">{f.comment || '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
