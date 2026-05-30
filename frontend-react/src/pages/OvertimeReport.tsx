import { useEffect, useState } from 'react'
import { fetchOvertimeReport, fetchUsers } from '../api/timesheets'
import { FieldLabel, PrimaryButton, SelectInput, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function OvertimeReportPage() {
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
    fetchUsers().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {})
  }, [])

  async function generate() {
    setError('')
    try {
      const res = await fetchOvertimeReport(filters)
      setReports(res.data.reports || [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Report failed')
    }
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader title={t('overtimeReport')} subtitle={t('overtimeReportSubtitle')} />

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
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">{t('expectedHours')}</div><div className="text-2xl font-bold">{report.expected_hours}</div></div>
            <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">{t('actualHours')}</div><div className="text-2xl font-bold">{report.actual_hours}</div></div>
            <div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-amber-700">{t('overtime')}</div><div className="text-2xl font-bold text-amber-700">{report.overtime_hours}</div></div>
          </div>

          <h3 className="mb-3 font-semibold">{t('overtimeEntries')}</h3>
          <div className="space-y-3">
            {(report.overtime_entries || []).map((entry: any) => (
              <div key={entry.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                <div className="font-semibold">{entry.work_date?.slice?.(0, 10) || entry.work_date} — {entry.activity?.name}</div>
                <div>{t('hours')}: {entry.hours_worked} | {t('overtime')}: {entry.overtime_hours}</div>
                <div className="text-slate-600">{entry.notes || entry.description || '—'}</div>
              </div>
            ))}
            {(report.overtime_entries || []).length === 0 && <div className="text-slate-500">{t('noData')}</div>}
          </div>
        </TimesheetCard>
      ))}

      {reports.length === 0 && !error && (
        <TimesheetCard><div className="py-8 text-center text-slate-500">{t('generateReportHint')}</div></TimesheetCard>
      )}
    </div>
  )
}
