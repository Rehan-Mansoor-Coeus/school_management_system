import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { fetchBorrowRequests, type BorrowRequest } from '../../api/library'
import { EmptyState, PageHeader, Spinner, StatusBadge, TableWrap, tdClass, thClass } from '../../components/library/LibraryUi'

export default function StudentPendingBorrowPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BorrowRequest[]>([])

  useEffect(() => {
    fetchBorrowRequests({ status: 'pending' })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Pending Approval"
        subtitle="Books you requested that are awaiting librarian approval"
        icon={Clock}
      />
      <TableWrap>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className={thClass}>Book</th>
              <th className={thClass}>Requested</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6">
                  <EmptyState message="No pending borrow requests." />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className={tdClass}>{row.book?.title || `#${row.book_id}`}</td>
                  <td className={tdClass}>{row.requested_from_datetime?.slice(0, 10) || '—'}</td>
                  <td className={tdClass}>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
    </div>
  )
}
