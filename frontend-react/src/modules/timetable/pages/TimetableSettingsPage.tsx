import { useEffect, useState } from 'react'
import {
  DAY_LABELS,
  fetchTimetableSettings,
  formatTimetableError,
  updateTimetableSettings,
  type TimetableSettings,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { Field } from '../components/ttui'

export default function TimetableSettingsPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.settings.manage', 'timetable.manage'] })

  const [settings, setSettings] = useState<TimetableSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      try { setSettings(await fetchTimetableSettings()) }
      catch (error) { pushToast(formatTimetableError(error, 'Failed to load settings'), 'error') }
      finally { setLoading(false) }
    }
    run()
  }, [pushToast])

  const update = (patch: Partial<TimetableSettings>) => setSettings((prev) => (prev ? { ...prev, ...patch } : prev))

  const toggleDay = (day: number) => {
    if (!settings) return
    const set = new Set(settings.working_days)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    update({ working_days: Array.from(set).sort((a, b) => a - b) })
  }

  const submit = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const saved = await updateTimetableSettings({
        max_weekly_teaching_hours: settings.max_weekly_teaching_hours,
        default_lesson_minutes: settings.default_lesson_minutes,
        weeks_per_semester: settings.weeks_per_semester,
        day_start_time: settings.day_start_time,
        day_end_time: settings.day_end_time,
        working_days: settings.working_days,
        require_dean_approval: settings.require_dean_approval,
      })
      setSettings(saved)
      pushToast('Settings saved.', 'success')
    } catch (error) { pushToast(formatTimetableError(error, 'Failed to save settings'), 'error') }
    finally { setSaving(false) }
  }

  if (loading || !settings) return <p className="text-sm text-slate-400">Loading…</p>

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Timetable Settings</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Max Weekly Teaching Hours">
            <input type="number" disabled={!canManage} value={settings.max_weekly_teaching_hours} onChange={(e) => update({ max_weekly_teaching_hours: Number(e.target.value) })} className="ttinput" />
          </Field>
          <Field label="Default Lesson Length (minutes)">
            <input type="number" disabled={!canManage} value={settings.default_lesson_minutes} onChange={(e) => update({ default_lesson_minutes: Number(e.target.value) })} className="ttinput" />
          </Field>
          <Field label="Weeks per Semester">
            <input type="number" disabled={!canManage} value={settings.weeks_per_semester} onChange={(e) => update({ weeks_per_semester: Number(e.target.value) })} className="ttinput" />
          </Field>
          <div />
          <Field label="Day Start Time">
            <input type="time" disabled={!canManage} value={settings.day_start_time?.slice(0, 5)} onChange={(e) => update({ day_start_time: e.target.value })} className="ttinput" />
          </Field>
          <Field label="Day End Time">
            <input type="time" disabled={!canManage} value={settings.day_end_time?.slice(0, 5)} onChange={(e) => update({ day_end_time: e.target.value })} className="ttinput" />
          </Field>
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-xs font-medium text-slate-600">Working Days</span>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                type="button"
                disabled={!canManage}
                onClick={() => toggleDay(d)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${settings.working_days.includes(d) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600'}`}
              >
                {DAY_LABELS[d].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" disabled={!canManage} checked={settings.require_dean_approval} onChange={(e) => update({ require_dean_approval: e.target.checked })} className="h-4 w-4" />
          Require Dean approval before publishing a timetable
        </label>

        {canManage && (
          <div className="mt-6">
            <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Settings'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
