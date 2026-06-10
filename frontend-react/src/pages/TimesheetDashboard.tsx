import { useEffect, useState } from 'react'
import { fetchTimesheetDashboard } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import DashboardStatCard from '../components/ui/DashboardStatCard'

export default function TimesheetDashboardPage() {
  const [data, setData] = useState<any>(null)
  const { pushToast } = useToast()
  const { t } = useTimesheetI18n()

  useEffect(() => {
    fetchTimesheetDashboard()
      .then((res) => setData(res.data))
      .catch((error: any) => pushToast(error?.response?.data?.message || 'Failed to load dashboard', 'error'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t('dashboard')}</h2>
        <p className="text-sm text-slate-500">{t('timesheets')}</p>
      </div>
      {!data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{t('loading')}</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard label={t('pendingSubmissions')} value={data.pending_submissions} to="/timesheets/fill" />
            <DashboardStatCard label={t('pendingApprovals')} value={data.pending_approvals} to="/timesheets/admin/manage-all" />
            <DashboardStatCard label={t('expectedHours')} value={data.expected_hours} to="/timesheets/working-week" />
            <DashboardStatCard label={t('completedContactHours')} value={data.completed_hours} to="/timesheets/admin/reports" />
            <DashboardStatCard label={t('overtime')} value={data.overtime_hours} to="/timesheets/admin/overtime-report" />
            <DashboardStatCard label={t('underTime')} value={data.under_time_hours} to="/timesheets/admin/reports" />
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">{t('todaySchedules')}</h3>
            <SimpleSchedule rows={data.today_schedules || []} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">{t('weeklySchedules')}</h3>
            <SimpleSchedule rows={data.weekly_schedules || []} />
          </section>
        </>
      )}
    </div>
  )
}

function SimpleSchedule({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No rows.</p>
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead><tr><th className="py-2">Day</th><th>Course</th><th>Class</th><th>Start</th><th>End</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="py-2">{row.day_of_week}</td>
              <td>{row.course?.name || '-'}</td>
              <td>{row.class_model?.name || '-'}</td>
              <td>{row.start_time}</td>
              <td>{row.end_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
