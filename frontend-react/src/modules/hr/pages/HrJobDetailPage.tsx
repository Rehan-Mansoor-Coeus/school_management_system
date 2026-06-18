import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { assignHrJobStaff, fetchHrJobDetail, formatHrError, removeHrJobStaff, syncHrJobTimesheet } from '../../../api/hr'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function HrJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { pushToast } = useToast()
  const [data, setData] = useState<{ job?: Record<string, any>; staff: any[] }>({ staff: [] })
  const [staffId, setStaffId] = useState('')
  const [dailyRate, setDailyRate] = useState('')

  const load = async () => {
    if (!id) return
    try {
      setData(await fetchHrJobDetail(Number(id)))
    } catch (error) {
      pushToast(formatHrError(error, 'Failed to load job detail'), 'error')
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const addStaff = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id) return
    try {
      await assignHrJobStaff(Number(id), {
        staff_profile_id: Number(staffId),
        daily_rate: dailyRate ? Number(dailyRate) : undefined,
      })
      setStaffId('')
      setDailyRate('')
      load()
      pushToast('Staff assigned to job.')
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to assign staff'), 'error')
    }
  }

  const removeStaff = async (rowId: number) => {
    if (!id) return
    try {
      await removeHrJobStaff(Number(id), rowId)
      load()
      pushToast('Assignment removed.')
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to remove assignment'), 'error')
    }
  }

  const syncTimesheet = async () => {
    if (!id) return
    try {
      const result = await syncHrJobTimesheet(Number(id))
      pushToast(`Timesheet synced (${result.updated || 0} updated).`)
      load()
    } catch (error) {
      pushToast(formatHrError(error, 'Unable to sync timesheet'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{String(data.job?.name || 'Job Detail')}</h2>
        <p className="mt-1 text-sm text-slate-500">Manage assigned staff and sync timesheet totals for payroll accuracy.</p>
      </div>

      <form onSubmit={addStaff} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <FormField label="Staff Profile ID" required>
          <input value={staffId} onChange={(event) => setStaffId(event.target.value)} className={formInputClass} required />
        </FormField>
        <FormField label="Daily Rate">
          <input type="number" min="0" step="0.01" value={dailyRate} onChange={(event) => setDailyRate(event.target.value)} className={formInputClass} />
        </FormField>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Assign Staff</button>
          <button type="button" onClick={syncTimesheet} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Sync Timesheet</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Staff ID</th>
              <th className="px-4 py-3 font-semibold">Days Worked</th>
              <th className="px-4 py-3 font-semibold">Daily Rate</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.staff.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No assignments yet.</td></tr>
            ) : data.staff.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.staff_profile_id}</td>
                <td className="px-4 py-3">{row.days_worked}</td>
                <td className="px-4 py-3">{row.daily_rate}</td>
                <td className="px-4 py-3">{row.day_status}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => removeStaff(Number(row.id))} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
