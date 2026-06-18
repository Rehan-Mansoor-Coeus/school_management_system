import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import { createRoom, deleteRoom, fetchHostelReference, fetchRooms, formatHostelError, updateRoom } from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

const emptyForm = {
  hostel_id: '', room_number: '', room_type: 'double', capacity: '2', monthly_fee: '0', floor_number: '', facilities: '', status: 'available',
}

export default function RoomsPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rooms, setRooms] = useState<any[]>([])
  const [hostels, setHostels] = useState<any[]>([])
  const [filterHostel, setFilterHostel] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    const [rRes, refRes] = await Promise.all([
      fetchRooms(filterHostel ? { hostel_id: Number(filterHostel) } : undefined),
      fetchHostelReference(),
    ])
    setRooms(rRes.data?.data || [])
    setHostels(refRes.data?.data?.hostels || [])
  }

  useEffect(() => { load() }, [filterHostel])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, hostel_id: filterHostel || '' }); setOpen(true) }
  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      hostel_id: String(r.hostel_id), room_number: r.room_number, room_type: r.room_type,
      capacity: String(r.capacity), monthly_fee: String(r.monthly_fee), floor_number: r.floor_number || '',
      facilities: r.facilities || '', status: r.status,
    })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      hostel_id: Number(form.hostel_id),
      capacity: Number(form.capacity),
      monthly_fee: Number(form.monthly_fee),
    }
    try {
      if (editing) await updateRoom(editing.id, payload)
      else await createRoom(payload)
      pushToast('Saved.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Save failed'), 'error')
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this room?')) return
    try {
      await deleteRoom(id)
      pushToast('Deleted.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Delete failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <select value={filterHostel} onChange={(e) => setFilterHostel(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">{t('selectHostel')} — all</option>
          {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <button onClick={openCreate} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('add')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('roomNumber')}</th>
              <th className="px-4 py-3">{t('roomType')}</th>
              <th className="px-4 py-3">{t('capacity')}</th>
              <th className="px-4 py-3">{t('bed')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.hostel?.name}</td>
                <td className="px-4 py-3">{r.room_number}</td>
                <td className="px-4 py-3">{t(r.room_type)}</td>
                <td className="px-4 py-3">{r.occupied_beds}/{r.capacity}</td>
                <td className="px-4 py-3">{(r.beds || []).map((b: any) => `${b.bed_label} (${b.status})`).join(', ') || '—'}</td>
                <td className="px-4 py-3">{t(r.status)}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEdit(r)} className="rounded-lg bg-slate-100 px-3 py-1">{t('edit')}</button>
                  <button onClick={() => remove(r.id)} className="rounded-lg bg-red-50 px-3 py-1 text-red-700">{t('delete')}</button>
                </td>
              </tr>
            ))}
            {!rooms.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? t('edit') : t('add')} open={open} onClose={() => setOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="room-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="room-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <select required value={form.hostel_id} onChange={(e) => setForm({ ...form, hostel_id: e.target.value })} className="rounded-xl border px-3 py-2 sm:col-span-2">
            <option value="">{t('selectHostel')}</option>
            {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder={t('roomNumber')} className="rounded-xl border px-3 py-2" />
          <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="rounded-xl border px-3 py-2">
            {['single', 'double', 'triple', 'quad'].map((rt) => <option key={rt} value={rt}>{t(rt)}</option>)}
          </select>
          <input required type="number" min="1" max="8" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder={t('capacity')} className="rounded-xl border px-3 py-2" />
          <input required type="number" min="0" step="0.01" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} placeholder={t('monthlyFee')} className="rounded-xl border px-3 py-2" />
          <input value={form.floor_number} onChange={(e) => setForm({ ...form, floor_number: e.target.value })} placeholder={t('floor')} className="rounded-xl border px-3 py-2" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border px-3 py-2">
            {['available', 'maintenance', 'closed'].map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </select>
          <textarea value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} placeholder={t('facilities')} className="rounded-xl border px-3 py-2 sm:col-span-2" rows={2} />
        </form>
      </Modal>
    </div>
  )
}
