import { useEffect, useState } from 'react'
import { approveTimesheetEntry, fetchManageAllEntries, fetchUsers, rejectTimesheetEntry } from '../api/timesheets'
import { FieldLabel, PrimaryButton, SelectInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function TimesheetManageAllPage() {
  const { t } = useTimesheetI18n()
  const [entries, setEntries] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [filters, setFilters] = useState({ user_id: 'all', month: new Date().toISOString().slice(0, 7) })
  const [totalHours, setTotalHours] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetchManageAllEntries(filters)
    setEntries(res.data.entries?.data || res.data.entries || [])
    setTotalHours(res.data.total_hours || 0)
  }

  useEffect(() => {
    fetchUsers().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {})
    load().catch(() => setError('Failed to load entries'))
  }, [filters.user_id, filters.month])

  function exportCsv() {
    const rows = [['Date', 'Employee', 'Activity', 'Hours', 'Status', 'Notes']]
    entries.forEach(e => rows.push([
      e.work_date,
      e.user?.name || '',
      e.activity?.name || '',
      String(e.hours_worked),
      e.status,
      e.notes || e.description || '',
    ]))
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'timesheet-entries.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader
        title={t('manageAll')}
        subtitle={t('manageAllSubtitle')}
        action={<PrimaryButton onClick={exportCsv}>⬇ {t('export')}</PrimaryButton>}
      />
      {error && <div className="text-sm text-red-600">{error}</div>}

      <TimesheetCard>
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>{t('filterEmployee')}</FieldLabel>
            <SelectInput value={filters.user_id} onChange={e => setFilters({ ...filters, user_id: e.target.value })}>
              <option value="all">{t('allEmployees')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectInput>
          </div>
          <div>
            <FieldLabel>{t('filterMonth')}</FieldLabel>
            <SelectInput value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const val = d.toISOString().slice(0, 7)
                return <option key={val} value={val}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
              })}
            </SelectInput>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1e3a5f]">{t('loggedEntries')}</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{t('totalHours')}: {totalHours.toFixed(1)}</span>
        </div>

        <div className="overflow-x-auto border-t-4 border-[#eab308] pt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">{t('date')}</th>
                <th className="py-3 pr-4">{t('employee')}</th>
                <th className="py-3 pr-4">{t('activity')}</th>
                <th className="py-3 pr-4">{t('hours')}</th>
                <th className="py-3 pr-4">{t('status')}</th>
                <th className="py-3 pr-4">{t('notes')}</th>
                <th className="py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b">
                  <td className="py-3 pr-4">{entry.work_date?.slice?.(0, 10) || entry.work_date}</td>
                  <td className="py-3 pr-4">{entry.user?.name}</td>
                  <td className="py-3 pr-4">{entry.activity?.name}</td>
                  <td className="py-3 pr-4 font-semibold">{Number(entry.hours_worked).toFixed(2)}</td>
                  <td className="py-3 pr-4 capitalize">{entry.status}</td>
                  <td className="py-3 pr-4">{entry.notes || entry.description || '—'}</td>
                  <td className="py-3">
                    {entry.status === 'pending' && (
                      <>
                        <button className="mr-2 text-green-700" onClick={() => approveTimesheetEntry(entry.id).then(load)}>{t('approve')}</button>
                        <button className="text-red-600" onClick={() => rejectTimesheetEntry(entry.id, { reason: 'Rejected' }).then(load)}>{t('reject')}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">{t('noEntriesFound')}</td></tr>}
            </tbody>
          </table>
        </div>
      </TimesheetCard>
    </div>
  )
}
