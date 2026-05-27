import { useState } from 'react'
import { fetchExtendedReports, fetchTimesheetReports } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function TimesheetReportsPage() {
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly')
  const [reportType, setReportType] = useState<'weekly_monthly' | 'course_contact_hours' | 'topics_taught' | 'hourly_payment'>('weekly_monthly')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const { pushToast } = useToast()

  const load = async () => {
    if (!from || !to) return
    try {
      if (reportType === 'weekly_monthly') {
        const res = await fetchTimesheetReports({ range, from, to })
        setRows(res.data.rows || [])
      } else {
        const res = await fetchExtendedReports(reportType)
        setRows(res.data.rows || [])
      }
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load report', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Timesheet Reports</h2>
        <p className="text-sm text-slate-500">Weekly and monthly comparisons of expected vs submitted hours.</p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="weekly_monthly">Weekly/Monthly Summary</option>
          <option value="course_contact_hours">Course Contact Hours</option>
          <option value="topics_taught">Topics Taught</option>
          <option value="hourly_payment">Hourly Payment</option>
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value as 'weekly' | 'monthly')} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
        <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Run Report</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {Object.keys(rows[0] || { col1: 'value' }).map((key) => (
                <th key={key} className="px-4 py-3 font-semibold">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No report rows.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.period || row.id || row.name || Math.random()}>
                {Object.keys(row).map((key) => (
                  <td key={key} className="px-4 py-3">{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
