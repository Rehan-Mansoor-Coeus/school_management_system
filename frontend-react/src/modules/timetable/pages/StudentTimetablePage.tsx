import { useEffect, useState } from 'react'
import { DAY_LABELS, fetchMyTimetable, formatTimetableError } from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'

type Entry = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  course?: { code: string; name: string } | null
  teacher?: { name: string } | null
  classroom?: { name: string } | null
}

export default function StudentTimetablePage() {
  const { pushToast } = useToast()
  const [entries, setEntries] = useState<Entry[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchMyTimetable()
        setEntries((res.entries || []) as Entry[])
        setMessage(res.message || null)
      } catch (error) { pushToast(formatTimetableError(error, 'Failed to load timetable'), 'error') }
      finally { setLoading(false) }
    }
    run()
  }, [pushToast])

  const byDay = (d: number) => entries.filter((e) => e.day_of_week === d).sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">My Timetable</h2>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          {message || 'No timetable has been published for your programme and semester yet.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const slots = byDay(d)
            if (slots.length === 0) return null
            return (
              <div key={d} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{DAY_LABELS[d]}</h3>
                <ul className="space-y-2">
                  {slots.map((e) => (
                    <li key={e.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                      <div className="font-medium text-slate-900">{e.start_time.slice(0, 5)}–{e.end_time.slice(0, 5)}</div>
                      <div className="text-slate-700">{e.course ? `${e.course.code} ${e.course.name}` : '-'}</div>
                      <div className="text-xs text-slate-500">{e.teacher?.name || ''} {e.classroom?.name ? `· ${e.classroom.name}` : ''}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
