import { useEffect, useState } from 'react'
import {
  ROOM_TYPE_LABELS,
  createClassroom,
  deleteClassroom,
  fetchClassrooms,
  formatTimetableError,
  updateClassroom,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { Field, Modal } from '../components/ttui'

type Room = { id: number; name: string; building?: string | null; capacity: number; room_type: string; is_active: boolean }

const empty = { name: '', building: '', capacity: '30', room_type: 'lecture_hall', is_active: true }

export default function ClassroomsPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.classrooms.manage', 'timetable.manage'] })

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setRooms((await fetchClassrooms()) as Room[])
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to load classrooms'), 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true) }
  const openEdit = (r: Room) => { setEditing(r); setForm({ name: r.name, building: r.building ?? '', capacity: String(r.capacity), room_type: r.room_type, is_active: r.is_active }); setShowForm(true) }

  const submit = async () => {
    setSaving(true)
    try {
      const payload = { ...form, capacity: Number(form.capacity) || 0 }
      if (editing) { await updateClassroom(editing.id, payload); pushToast('Classroom updated.', 'success') }
      else { await createClassroom(payload); pushToast('Classroom created.', 'success') }
      setShowForm(false); await load()
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to save classroom'), 'error')
    } finally { setSaving(false) }
  }

  const remove = async (r: Room) => {
    if (!window.confirm(`Delete classroom ${r.name}?`)) return
    try { await deleteClassroom(r.id); pushToast('Classroom deleted.', 'success'); await load() }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to delete classroom'), 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Classrooms</h2>
        {canManage && <button onClick={openCreate} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">+ New Classroom</button>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Building</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              : rooms.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No classrooms yet.</td></tr>
              : rooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.building || '-'}</td>
                  <td className="px-4 py-3">{r.capacity}</td>
                  <td className="px-4 py-3">{ROOM_TYPE_LABELS[r.room_type] || r.room_type}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-right">
                    {canManage && <button onClick={() => openEdit(r)} className="text-sm font-medium text-blue-600 hover:underline">Edit</button>}
                    {canManage && <button onClick={() => remove(r)} className="ml-3 text-sm font-medium text-red-600 hover:underline">Delete</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit Classroom' : 'New Classroom'} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Classroom Name *"><input value={String(form.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ttinput" /></Field>
            <Field label="Building"><input value={String(form.building)} onChange={(e) => setForm({ ...form, building: e.target.value })} className="ttinput" /></Field>
            <Field label="Capacity"><input type="number" value={String(form.capacity)} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="ttinput" /></Field>
            <Field label="Room Type">
              <select value={String(form.room_type)} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="ttinput">
                {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />Active</label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
