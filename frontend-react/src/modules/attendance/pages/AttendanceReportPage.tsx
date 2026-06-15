import { useEffect, useState } from 'react'
import { fetchAttendanceAdminReport, formatAttendanceError } from '../../../api/attendance'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function AttendanceReportPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState({ from: '', to: '', user_id: '' })

  const load = async (params?: { from?: string; to?: string; user_id?: number }) => {
    try {
      const payload = await fetchAttendanceAdminReport(params)
      setRows(Array.isArray(payload?.data) ? payload.data : [])
    } catch (error) {
      pushToast(formatAttendanceError(error, 'Failed to load attendance admin report'), 'error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await load({
      from: form.from || undefined,
      to: form.to || undefined,
      user_id: form.user_id ? Number(form.user_id) : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <FormField label="From"><input type="date" value={form.from} onChange={(event) => setForm((prev) => ({ ...prev, from: event.target.value }))} className={formInputClass} /></FormField>
        <FormField label="To"><input type="date" value={form.to} onChange={(event) => setForm((prev) => ({ ...prev, to: event.target.value }))} className={formInputClass} /></FormField>
        <FormField label="User ID"><input value={form.user_id} onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))} className={formInputClass} /></FormField>
        <div className="flex items-end"><button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Filter</button></div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Clock In</th>
              <th className="px-4 py-3 font-semibold">Clock Out</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No records.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.user_name || '-'}</td>
                <td className="px-4 py-3">{row.user_email || '-'}</td>
                <td className="px-4 py-3">{row.clock_in_at || '-'}</td>
                <td className="px-4 py-3">{row.clock_out_at || '-'}</td>
                <td className="px-4 py-3">{row.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
