import { useEffect, useState } from 'react'
import { fetchTimesheetAdminReport, fetchUsers } from '../api/timesheets'
import { FieldLabel, PrimaryButton, SelectInput, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function TimesheetReportPage() {
  const { t } = useTimesheetI18n()
  const [users, setUsers] = useState<any[]>([])
  const [filters, setFilters] = useState({
    from_date: new Date().toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    user_id: 'all',
  })
  const [reports, setReports] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {})
  }, [])

  async function generate() {
    setError('')
    try {
      const result = await fetchTimesheetAdminReport(filters)
      setReports(result.reports)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Report failed')
    }
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader title={t('timeSheetReport')} subtitle={t('timeSheetReportSubtitle')} />

      <TimesheetCard>
        <div className="grid gap-4 md:grid-cols-4 md:items-end">
          <div>
            <FieldLabel>{t('fromDate')}</FieldLabel>
            <TextInput type="date" value={filters.from_date} onChange={e => setFilters({ ...filters, from_date: e.target.value })} />
          </div>
          <div>
            <FieldLabel>{t('toDate')}</FieldLabel>
            <TextInput type="date" value={filters.to_date} onChange={e => setFilters({ ...filters, to_date: e.target.value })} />
          </div>
          <div>
            <FieldLabel>{t('employee')}</FieldLabel>
            <SelectInput value={filters.user_id} onChange={e => setFilters({ ...filters, user_id: e.target.value })}>
              <option value="all">{t('allEmployees')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectInput>
          </div>
          <PrimaryButton onClick={generate}>🔎 {t('generateReport')}</PrimaryButton>
        </div>
      </TimesheetCard>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {reports.map(report => (
        <TimesheetCard key={report.employee.id}>
          <h2 className="mb-4 text-xl font-bold text-[#1e3a5f]">{report.employee.name}</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t('expectedHours')} value={report.expected_hours} />
            <Stat label={t('actualHours')} value={report.actual_hours} />
            <Stat label={t('overtime')} value={report.overtime_hours} />
            <Stat label={t('underTime')} value={report.under_time_hours} />
            <Stat label={t('approvedHours')} value={report.approved_hours} />
            <Stat label={t('pendingHours')} value={report.pending_hours} />
            <Stat label={t('expectedWeeklyHours')} value={report.expected_weekly_hours} />
          </div>

          <h3 className="mb-3 font-semibold">{t('dailyBreakdown')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">{t('date')}</th>
                  <th className="py-2 pr-4">{t('expectedHours')}</th>
                  <th className="py-2 pr-4">{t('actualHours')}</th>
                  <th className="py-2">{t('overtime')}</th>
                </tr>
              </thead>
              <tbody>
                {(report.daily_breakdown || []).map((row: any) => (
                  <tr key={row.date} className="border-b">
                    <td className="py-2 pr-4">{row.date}</td>
                    <td className="py-2 pr-4">{row.expected_hours}</td>
                    <td className="py-2 pr-4">{row.actual_hours}</td>
                    <td className="py-2">{row.overtime_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TimesheetCard>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-[#1e3a5f]">{value}</div>
    </div>
  )
}
