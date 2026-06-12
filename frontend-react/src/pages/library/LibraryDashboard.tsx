import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BookOpenCheck, CalendarClock, BookCopy, CircleDollarSign, Library as LibraryIcon, Flame } from 'lucide-react'
import { fetchLibraryDashboard } from '../../api/library'
import { Card, PageHeader, Spinner, StatCard, EmptyState } from '../../components/library/LibraryUi'
import { useAuth } from '../../context/AuthContext'
import { isStudentLibraryUser } from '../../components/library/libraryMenuConfig'

const BARS = ['#1e3a5f', '#2a4a73', '#3b82f6', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b']

export default function LibraryDashboard() {
  const { hasPermission } = useAuth()
  const studentView = isStudentLibraryUser(hasPermission)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchLibraryDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const stats = data || {}

  if (studentView) {
    return (
      <div>
        <PageHeader title="Library Dashboard" subtitle="Your borrowing overview" icon={LibraryIcon} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Total Books Borrowed" value={stats.total_borrowed ?? 0} icon={BookOpenCheck} tone="blue" />
          <StatCard label="Book Due for Return" value={stats.due_for_return ?? 0} icon={CalendarClock} tone="orange" />
          <StatCard label="Books in Keeping" value={stats.books_in_keeping ?? 0} icon={BookCopy} tone="violet" />
          <StatCard label="Unpaid Fines" value={Number(stats.unpaid_fines ?? 0).toFixed(2)} icon={CircleDollarSign} tone="rose" />
        </div>
      </div>
    )
  }

  const categoryData = (stats.borrowed_by_category || []).map((row: any) => ({ name: row.category, count: Number(row.count) }))

  return (
    <div>
      <PageHeader title="Library Dashboard" subtitle="Overview of your institution's library" icon={LibraryIcon} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Books" value={stats.total_books ?? 0} icon={BookOpenCheck} tone="blue" />
        <StatCard label="Total Copies" value={stats.total_copies ?? 0} icon={BookCopy} tone="violet" />
        <StatCard label="Available Copies" value={stats.available_copies ?? 0} icon={BookOpenCheck} tone="green" />
        <StatCard label="Borrowed" value={stats.borrowed_books ?? 0} icon={BookCopy} tone="violet" />
        <StatCard label="Pending Requests" value={stats.pending_requests ?? 0} icon={CalendarClock} tone="amber" />
        <StatCard label="Overdue Books" value={stats.overdue_books ?? 0} icon={CalendarClock} tone="rose" />
        <StatCard label="Unpaid Fines" value={Number(stats.unpaid_fines ?? 0).toFixed(2)} icon={CircleDollarSign} tone="rose" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Books Borrowed by Category</h2>
          {categoryData.length === 0 ? (
            <EmptyState message="No borrowing activity yet." />
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={BARS[i % BARS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Flame className="h-4 w-4 text-amber-500" /> Frequently Signed Books
          </h2>
          {(stats.frequently_signed || []).length === 0 ? (
            <EmptyState message="No frequently signed books yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {(stats.frequently_signed || []).map((book: any) => (
                <li key={book.id} className="flex items-center justify-between py-2.5">
                  <span className="truncate text-sm text-slate-700">{book.title}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {book.borrow_count} borrows
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
