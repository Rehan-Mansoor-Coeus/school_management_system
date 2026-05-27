import { useEffect, useState } from 'react'
import { acceptTimetableSuggestion, fetchCoursePlans, fetchShiftTypes, generateTimetableSuggestion } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function TimetableSuggestionPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [shiftTypes, setShiftTypes] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [suggestion, setSuggestion] = useState<any>(null)
  const { pushToast } = useToast()

  useEffect(() => {
    Promise.all([fetchCoursePlans(), fetchShiftTypes()])
      .then(([p, s]) => {
        setPlans(p.data || [])
        setShiftTypes(s.data || [])
      })
      .catch(() => pushToast('Failed to load timetable data', 'error'))
  }, [])

  const generate = async () => {
    if (!selectedPlanId) return
    try {
      const res = await generateTimetableSuggestion(Number(selectedPlanId))
      setPreview(res.data.preview)
      setSuggestion(res.data.suggestion)
      pushToast('Suggestion generated.')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to generate suggestion', 'error')
    }
  }

  const accept = async () => {
    if (!suggestion?.id || !selectedShiftTypeId) return
    try {
      await acceptTimetableSuggestion(suggestion.id, {
        shift_type_id: Number(selectedShiftTypeId),
        slots: preview?.slots || [],
      })
      pushToast('Timetable accepted and saved.')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to accept suggestion', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Timetable Suggestion</h2>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Select course plan</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.course?.name} ({p.required_contact_hours}h)</option>)}
        </select>
        <select value={selectedShiftTypeId} onChange={(e) => setSelectedShiftTypeId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Select shift type</option>
          {shiftTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={generate} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Generate</button>
          <button onClick={accept} className="rounded-xl bg-emerald-600 px-4 py-2 text-white">Accept</button>
        </div>
      </div>

      {preview && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <p>Required: {preview.total_required_contact_hours}</p>
            <p>Suggested: {preview.total_suggested_contact_hours}</p>
            <p>Remaining: {preview.remaining_unscheduled_contact_hours}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr><th className="py-2">Teacher</th><th>Day</th><th>Start</th><th>End</th><th>Hours</th></tr></thead>
              <tbody>
                {(preview.slots || []).map((slot: any, idx: number) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-2">{slot.teacher_id}</td>
                    <td>{slot.day_of_week}</td>
                    <td>{slot.start_time}</td>
                    <td>{slot.end_time}</td>
                    <td>{slot.expected_contact_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
