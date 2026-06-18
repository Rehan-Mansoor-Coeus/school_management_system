import { useEffect, useState } from 'react'
import {
  DAY_LABELS,
  fetchAvailability,
  fetchTimetableOptions,
  formatTimetableError,
  saveAvailability,
  type TimetableOptions,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'

type DayRow = { day_of_week: number; is_available: boolean; start_time: string; end_time: string }

const DAYS = [1, 2, 3, 4, 5, 6, 7]

function defaultDays(): DayRow[] {
  return DAYS.map((d) => ({ day_of_week: d, is_available: d <= 5, start_time: '', end_time: '' }))
}

export default function AvailabilityPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.availability.manage', 'timetable.manage'] })

  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [teacherId, setTeacherId] = useState<string>('')
  const [days, setDays] = useState<DayRow[]>(defaultDays())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      try { setOptions(await fetchTimetableOptions()) }
      catch (error) { pushToast(formatTimetableError(error, 'Failed to load options'), 'error') }
    }
    run()
  }, [pushToast])

  useEffect(() => {
    if (!teacherId) { setDays(defaultDays()); return }
    const run = async () => {
      try {
        const existing = (await fetchAvailability(Number(teacherId))) as Array<{ day_of_week: number; is_available: boolean; start_time?: string | null; end_time?: string | null }>
        const map = new Map(existing.map((e) => [e.day_of_week, e]))
        setDays(DAYS.map((d) => {
          const e = map.get(d)
          return {
            day_of_week: d,
            is_available: e ? e.is_available : d <= 5,
            start_time: e?.start_time ? String(e.start_time).slice(0, 5) : '',
            end_time: e?.end_time ? String(e.end_time).slice(0, 5) : '',
          }
        }))
      } catch (error) { pushToast(formatTimetableError(error, 'Failed to load availability'), 'error') }
    }
    run()
  }, [teacherId, pushToast])

  const update = (idx: number, patch: Partial<DayRow>) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const submit = async () => {
    if (!teacherId) { pushToast('Select a teacher first.', 'error'); return }
    setSaving(true)
    try {
      await saveAvailability({
        teacher_id: Number(teacherId),
        days: days.map((d) => ({
          day_of_week: d.day_of_week,
          is_available: d.is_available,
          start_time: d.start_time || null,
          end_time: d.end_time || null,
        })),
      })
      pushToast('Availability saved.', 'success')
    } catch (error) { pushToast(formatTimetableError(error, 'Failed to save availability'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Teacher Availability</h2>

      <div className="max-w-sm">
        <label className="mb-1 block text-xs font-medium text-slate-600">Teacher</label>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="ttinput">
          <option value="">Select teacher…</option>
          {options?.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {teacherId && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Day</th><th className="px-4 py-3">Available</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((d, idx) => (
                <tr key={d.day_of_week}>
                  <td className="px-4 py-3 font-medium text-slate-900">{DAY_LABELS[d.day_of_week]}</td>
                  <td className="px-4 py-3">
                    <input type="checkbox" disabled={!canManage} checked={d.is_available} onChange={(e) => update(idx, { is_available: e.target.checked })} className="h-4 w-4" />
                  </td>
                  <td className="px-4 py-3"><input type="time" disabled={!canManage || !d.is_available} value={d.start_time} onChange={(e) => update(idx, { start_time: e.target.value })} className="ttinput max-w-[140px]" /></td>
                  <td className="px-4 py-3"><input type="time" disabled={!canManage || !d.is_available} value={d.end_time} onChange={(e) => update(idx, { end_time: e.target.value })} className="ttinput max-w-[140px]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {teacherId && canManage && (
        <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Availability'}</button>
      )}
      <p className="text-xs text-slate-500">Leave the time fields empty for full-day availability. The auto-generator respects these settings.</p>
    </div>
  )
}
