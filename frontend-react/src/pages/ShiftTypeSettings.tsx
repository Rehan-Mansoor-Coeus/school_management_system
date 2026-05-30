import { FormEvent, useEffect, useState } from 'react'
import { createShiftType, fetchShiftTypes, updateShiftType } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function ShiftTypeSettingsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', default_duration_minutes: '45', is_teaching_shift: true, is_staff_shift: false })
  const { pushToast } = useToast()

  const load = async () => {
    const res = await fetchShiftTypes()
    setRows(res.data || [])
  }

  useEffect(() => { load().catch(() => pushToast('Failed to load shift types', 'error')) }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createShiftType({
        ...form,
        default_duration_minutes: Number(form.default_duration_minutes),
      })
      setForm({ name: '', description: '', default_duration_minutes: '45', is_teaching_shift: true, is_staff_shift: false })
      pushToast('Shift type saved.')
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to save shift type', 'error')
    }
  }

  const toggleStatus = async (row: any) => {
    await updateShiftType(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Shift Type Settings</h2>
        <p className="text-sm text-slate-500">Teaching Shift, Straight Staff Shift, Administrative Shift, Custom Shift.</p>
      </div>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="number" min={15} max={480} value={form.default_duration_minutes} onChange={(e) => setForm((p) => ({ ...p, default_duration_minutes: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_teaching_shift} onChange={(e) => setForm((p) => ({ ...p, is_teaching_shift: e.target.checked }))} />Teaching</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_staff_shift} onChange={(e) => setForm((p) => ({ ...p, is_staff_shift: e.target.checked }))} />Staff</label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white sm:col-span-2 lg:col-span-1">Save</button>
      </form>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">{row.name}</p><p className="text-sm text-slate-500">{row.default_duration_minutes} mins • {row.status}</p></div>
            <button onClick={() => toggleStatus(row)} className="rounded-xl border border-slate-300 px-3 py-1 text-sm">{row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
