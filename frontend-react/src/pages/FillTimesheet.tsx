import { useEffect, useState } from 'react'
import { createTimesheetEntry, deleteTimesheetEntry, fetchTimesheetActivities, fetchTimesheetEntries, updateTimesheetEntry } from '../api/timesheets'
import { FieldLabel, PrimaryButton, SelectInput, TextArea, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function FillTimesheetPage() {
  const { t } = useTimesheetI18n()
  const [activities, setActivities] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), activity_id: '', hours: '', notes: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const [acts, ents] = await Promise.all([
      fetchTimesheetActivities(),
      fetchTimesheetEntries(),
    ])
    setActivities(acts.data || [])
    setEntries(Array.isArray(ents.data) ? ents.data : (ents.data?.data || []))
  }

  useEffect(() => { load().catch(() => setError('Failed to load timesheet data')) }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!activities.length) {
      setError(t('createActivityFirst'))
      return
    }
    try {
      const payload = { date: form.date, activity_id: Number(form.activity_id), hours: Number(form.hours), notes: form.notes }
      if (editingId) await updateTimesheetEntry(editingId, payload)
      else await createTimesheetEntry(payload)
      setForm({ date: new Date().toISOString().slice(0, 10), activity_id: '', hours: '', notes: '' })
      setEditingId(null)
      setMessage(t('saveEntry') + ' ✓')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader title={t('fillTimeSheet')} subtitle={t('fillTimeSheetSubtitle')} />
      {message && <div className="text-sm text-green-700">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <TimesheetCard>
          <h2 className="mb-1 text-lg font-bold text-[#1e3a5f]">🕐 {t('logTime')}</h2>
          <p className="mb-4 text-sm text-slate-500">{t('logTimeHint')}</p>
          <form onSubmit={save} className="space-y-4">
            <div>
              <FieldLabel required>{t('date')}</FieldLabel>
              <TextInput type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <FieldLabel required>{t('activity')}</FieldLabel>
              <SelectInput value={form.activity_id} onChange={e => setForm({ ...form, activity_id: e.target.value })} required>
                <option value="">{t('selectActivity')}</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel required>{t('hours')}</FieldLabel>
              <TextInput type="number" step="0.25" min="0.25" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="e.g. 8.0" required />
            </div>
            <div>
              <FieldLabel>{t('notes')}</FieldLabel>
              <TextArea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notesPlaceholder')} />
            </div>
            <PrimaryButton type="submit" className="w-full">💾 {t('saveEntry')}</PrimaryButton>
          </form>
        </TimesheetCard>

        <TimesheetCard>
          <h2 className="mb-1 text-lg font-bold text-[#1e3a5f]">{t('timeSheetHistory')}</h2>
          <p className="mb-4 text-sm text-slate-500">{t('recentEntries')}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3 pr-4">{t('date')}</th>
                  <th className="py-3 pr-4">{t('activity')}</th>
                  <th className="py-3 pr-4">{t('hours')}</th>
                  <th className="py-3 pr-4">{t('notes')}</th>
                  <th className="py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b">
                    <td className="py-3 pr-4 font-medium text-blue-700">{entry.work_date?.slice?.(0, 10) || entry.work_date}</td>
                    <td className="py-3 pr-4">{entry.activity?.name || '—'}</td>
                    <td className="py-3 pr-4 font-semibold">{Number(entry.hours_worked).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-600">{entry.notes || entry.description || '—'}</td>
                    <td className="py-3">
                      <button className="mr-3 text-blue-600" onClick={() => {
                        setEditingId(entry.id)
                        setForm({
                          date: (entry.work_date || '').slice(0, 10),
                          activity_id: String(entry.activity_id),
                          hours: String(entry.hours_worked),
                          notes: entry.notes || entry.description || '',
                        })
                      }}>{t('edit')}</button>
                      <button className="text-red-600" onClick={() => deleteTimesheetEntry(entry.id).then(load)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">{t('noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        </TimesheetCard>
      </div>
    </div>
  )
}
