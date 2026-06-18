import { useEffect, useState } from 'react'
import {
  downloadReport,
  fetchReport,
  fetchTimetableOptions,
  formatTimetableError,
  type TimetableOptions,
  type TimetableReport,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'

const REPORT_TYPES = [
  { value: 'department', label: 'Department Timetable' },
  { value: 'teacher', label: 'Teacher Timetable' },
  { value: 'classroom', label: 'Classroom Timetable' },
  { value: 'student', label: 'Student Timetable' },
  { value: 'contact_hours', label: 'Contact Hours Report' },
  { value: 'workload', label: 'Teacher Workload Report' },
]

export default function ReportsPage() {
  const { pushToast } = useToast()
  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [type, setType] = useState('department')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [report, setReport] = useState<TimetableReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => { try { setOptions(await fetchTimetableOptions()) } catch { /* ignore */ } }
    run()
  }, [])

  const params = () => ({ type, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })

  const run = async () => {
    setLoading(true)
    try { setReport(await fetchReport(params())) }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to build report'), 'error') }
    finally { setLoading(false) }
  }

  const exportFile = async (format: 'pdf' | 'csv') => {
    try {
      const blob = await downloadReport(params(), format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) { pushToast(formatTimetableError(error, 'Export failed'), 'error') }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Timetable Reports</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Report Type</label>
            <select value={type} onChange={(e) => { setType(e.target.value); setFilters({}); setReport(null) }} className="ttinput">
              {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {(type === 'department') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
              <select value={filters.department_id || ''} onChange={(e) => setFilters({ ...filters, department_id: e.target.value })} className="ttinput">
                <option value="">All</option>
                {options?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          {(type === 'teacher' || type === 'contact_hours' || type === 'workload') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Teacher</label>
              <select value={filters.teacher_id || ''} onChange={(e) => setFilters({ ...filters, teacher_id: e.target.value })} className="ttinput">
                <option value="">All</option>
                {options?.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {type === 'classroom' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Classroom</label>
              <select value={filters.classroom_id || ''} onChange={(e) => setFilters({ ...filters, classroom_id: e.target.value })} className="ttinput">
                <option value="">All</option>
                {options?.classrooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          {type === 'student' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Student ID</label>
              <input value={filters.student_id || ''} onChange={(e) => setFilters({ ...filters, student_id: e.target.value })} className="ttinput" placeholder="Student record ID" />
            </div>
          )}
          {(type === 'department' || type === 'teacher' || type === 'classroom') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Programme</label>
              <select value={filters.programme_id || ''} onChange={(e) => setFilters({ ...filters, programme_id: e.target.value })} className="ttinput">
                <option value="">All</option>
                {options?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={run} disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Loading…' : 'Run Report'}</button>
          {report && (
            <>
              <button onClick={() => exportFile('pdf')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Export PDF</button>
              <button onClick={() => exportFile('csv')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Export Excel (CSV)</button>
              <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Print</button>
            </>
          )}
        </div>
      </div>

      {report && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-slate-800">{report.title}</h3></div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>{report.columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.rows.length === 0 ? (
                <tr><td colSpan={report.columns.length} className="px-4 py-6 text-center text-slate-400">No records found.</td></tr>
              ) : report.rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {report.columns.map((c) => <td key={c.key} className="px-4 py-3 text-slate-700">{String(row[c.key] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
