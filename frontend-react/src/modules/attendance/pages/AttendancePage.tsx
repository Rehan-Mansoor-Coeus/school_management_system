import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clockIn, clockOut, fetchAttendanceMonthlySummary, fetchMyAttendanceRecords, formatAttendanceError } from '../../../api/attendance'
import { useToast } from '../../../components/ui/ToastProvider'

export default function AttendancePage() {
  const { pushToast } = useToast()
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ rows: [], month: '' })
  const [working, setWorking] = useState(false)

  const load = async () => {
    try {
      const [myData, monthly] = await Promise.all([fetchMyAttendanceRecords({ per_page: 10 }), fetchAttendanceMonthlySummary()])
      const rows = Array.isArray(myData?.data) ? myData.data : []
      setRecords(rows)
      setSummary(monthly)
    } catch (error) {
      pushToast(formatAttendanceError(error, 'Failed to load attendance records'), 'error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const today = useMemo(() => {
    if (!records.length) return 'No record today yet.'
    const latest = records[0]
    const date = String(latest.clock_in_at || '').slice(0, 10)
    if (date !== new Date().toISOString().slice(0, 10)) return 'No record today yet.'
    return latest.clock_out_at ? 'Clocked out today' : 'Clocked in (open session)'
  }, [records])

  const onClockIn = async () => {
    setWorking(true)
    try {
      await clockIn({ source: 'web' })
      pushToast('Clock in successful.')
      load()
    } catch (error) {
      pushToast(formatAttendanceError(error, 'Unable to clock in'), 'error')
    } finally {
      setWorking(false)
    }
  }

  const onClockOut = async () => {
    setWorking(true)
    try {
      await clockOut()
      pushToast('Clock out successful.')
      load()
    } catch (error) {
      pushToast(formatAttendanceError(error, 'Unable to clock out'), 'error')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">Clock in/out and monitor your daily status.</p>
        <p className="mt-3 text-sm font-medium text-slate-700">Today's status: {today}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={working} onClick={onClockIn} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Clock In</button>
          <button type="button" disabled={working} onClick={onClockOut} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Clock Out</button>
          <Link to="/attendance/report" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Admin Report</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Recent records</div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Clock In</th>
                <th className="px-4 py-3 font-semibold">Clock Out</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No records yet.</td></tr>
              ) : records.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{row.clock_in_at || '-'}</td>
                  <td className="px-4 py-3">{row.clock_out_at || '-'}</td>
                  <td className="px-4 py-3">{row.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            Monthly summary ({summary.month || '-'})
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Days</th>
                <th className="px-4 py-3 font-semibold">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {(summary.rows || []).length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No summary rows.</td></tr>
              ) : (summary.rows || []).map((row: any) => (
                <tr key={row.user_id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{row.user_name || '-'}</td>
                  <td className="px-4 py-3">{row.attendance_days || 0}</td>
                  <td className="px-4 py-3">{row.total_minutes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
