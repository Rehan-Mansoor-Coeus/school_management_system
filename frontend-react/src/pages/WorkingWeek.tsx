import { useEffect, useMemo, useState } from 'react'
import { fetchWorkingWeek, formatTimesheetError, saveWorkingWeek } from '../api/timesheets'
import { FieldLabel, PrimaryButton, TextInput, TimesheetCard, TimesheetPageHeader } from '../components/timesheets/TimesheetUi'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type DayRow = {
  day_of_week: number
  is_working_day: boolean
  start_time: string
  end_time: string
  break_minutes: number
  expected_minutes?: number
}

function calcHours(start: string, end: string, breakMinutes: number) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const total = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, (total - breakMinutes) / 60)
}

export default function WorkingWeekPage() {
  const { t } = useTimesheetI18n()
  const [days, setDays] = useState<DayRow[]>([])
  const [lunchBreak, setLunchBreak] = useState(60)
  const [summary, setSummary] = useState<any>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWorkingWeek().then(({ days, summary }) => {
      const loaded = days.map((d: any) => ({
        day_of_week: d.day_of_week,
        is_working_day: !!d.is_working_day,
        start_time: (d.start_time || '09:00:00').slice(0, 5),
        end_time: (d.end_time || '18:00:00').slice(0, 5),
        break_minutes: d.break_minutes ?? 60,
      }))
      setDays(loaded)
      setSummary(summary || {})
      if (loaded[0]) setLunchBreak(loaded[0].break_minutes || 60)
    }).catch((err) => setError(formatTimesheetError(err, 'Failed to load working week')))
  }, [])

  const computedSummary = useMemo(() => {
    const working = days.filter(d => d.is_working_day)
    const total = working.reduce((sum, d) => sum + calcHours(d.start_time, d.end_time, lunchBreak), 0)
    return { working_days: working.length, total_expected_hours: total.toFixed(2), break_minutes: lunchBreak }
  }, [days, lunchBreak])

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays(current => current.map((d, i) => i === index ? { ...d, ...patch, break_minutes: lunchBreak } : { ...d, break_minutes: lunchBreak }))
  }

  async function save() {
    setError('')
    setMessage('')
    try {
      const payload = {
        days: days.map(d => ({
          day_of_week: d.day_of_week,
          is_working_day: d.is_working_day,
          start_time: d.start_time,
          end_time: d.end_time,
          break_minutes: lunchBreak,
        })),
      }
      const result = await saveWorkingWeek(payload)
      setSummary(result.summary || computedSummary)
      setMessage(t('saveChanges') + ' ✓')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <TimesheetPageHeader
        title={t('workingWeekConfig')}
        subtitle={t('workingWeekSubtitle')}
        action={<PrimaryButton onClick={save}>💾 {t('saveChanges')}</PrimaryButton>}
      />
      {message && <div className="text-sm text-green-700">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <TimesheetCard>
          <h2 className="mb-1 text-xl font-bold text-[#1e3a5f]">📅 {t('weeklySchedule')}</h2>
          <p className="mb-5 text-sm text-slate-500">{t('weeklyScheduleHint')}</p>

          <div className="mb-6 max-w-xs">
            <FieldLabel>{t('lunchBreak')}</FieldLabel>
            <TextInput type="number" min={0} value={lunchBreak} onChange={e => setLunchBreak(Number(e.target.value))} />
            <p className="mt-1 text-xs text-slate-500">{t('lunchBreakHint')}</p>
          </div>

          <div className="space-y-3">
            {days.map((day, index) => (
              <div key={day.day_of_week} className="grid items-center gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[140px_1fr_1fr_100px]">
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={day.is_working_day} onChange={e => updateDay(index, { is_working_day: e.target.checked })} />
                  {dayNames[day.day_of_week - 1]}
                </label>
                {day.is_working_day ? (
                  <>
                    <div>
                      <FieldLabel>{t('from')}</FieldLabel>
                      <TextInput type="time" value={day.start_time} onChange={e => updateDay(index, { start_time: e.target.value })} />
                    </div>
                    <div>
                      <FieldLabel>{t('to')}</FieldLabel>
                      <TextInput type="time" value={day.end_time} onChange={e => updateDay(index, { end_time: e.target.value })} />
                    </div>
                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700">
                      {calcHours(day.start_time, day.end_time, lunchBreak).toFixed(2)}h
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-3 text-sm text-slate-400">{t('dayOff')}</div>
                )}
              </div>
            ))}
          </div>
        </TimesheetCard>

        <TimesheetCard className="bg-[#1e3a5f] text-white">
          <h3 className="mb-4 text-lg font-bold">ℹ️ {t('summary')}</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-blue-100">{t('workingDays')}</div>
              <div className="text-3xl font-bold">{computedSummary.working_days ?? summary.working_days ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-blue-100">{t('totalExpectedHours')}</div>
              <div className="text-4xl font-bold text-[#eab308]">{computedSummary.total_expected_hours ?? summary.total_expected_hours ?? '0.00'} h</div>
              <div className="text-sm text-blue-100">{t('perWeekNote')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-sm">
              {t('lunchBreakNote').replace('{minutes}', String(lunchBreak))}
            </div>
          </div>
        </TimesheetCard>
      </div>
    </div>
  )
}
