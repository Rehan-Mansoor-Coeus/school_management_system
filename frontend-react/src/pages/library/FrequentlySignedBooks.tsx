import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { fetchFrequentlySigned, type LibraryBook } from '../../api/library'
import { EmptyState, PageHeader, Spinner, Stars, TableWrap, tdClass, thClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'

type FrequentBook = LibraryBook & { borrow_count?: number }

export default function FrequentlySignedBooks() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<FrequentBook[]>([])

  useEffect(() => {
    fetchFrequentlySigned()
      .then((res) => setRows(res.data))
      .catch(() => pushToast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Frequently Signed Books" subtitle="Most borrowed books in your library" icon={Flame} />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No borrowing activity yet." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>#</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Times Borrowed</th>
              <th className={thClass}>Rating</th>
              <th className={thClass}>Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((b, i) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className={tdClass}>{i + 1}</td>
                <td className={`${tdClass} font-medium text-slate-800`}>{b.title}</td>
                <td className={tdClass}>{b.category?.name || '—'}</td>
                <td className={tdClass}>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{b.borrow_count ?? 0}</span>
                </td>
                <td className={tdClass}><Stars value={b.average_rating} /></td>
                <td className={tdClass}>
                  <span className="text-emerald-600">{b.availability?.available_copies ?? 0}</span>
                  <span className="text-slate-400"> / {b.availability?.total_copies ?? 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
