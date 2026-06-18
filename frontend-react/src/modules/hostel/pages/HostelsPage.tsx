import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import { createHostel, deleteHostel, fetchHostels, formatHostelError, updateHostel } from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

const emptyForm = {
  name: '', code: '', gender: 'mixed', location: '', caretaker_phone: '', caretaker_email: '', room_fee: '0', is_active: true,
}

export default function HostelsPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [hostels, setHostels] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => fetchHostels().then((res) => setHostels(res.data?.data || [])).catch(() => setHostels([]))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (h: any) => {
    setEditing(h)
    setForm({
      name: h.name, code: h.code, gender: h.gender, location: h.location || '',
      caretaker_phone: h.caretaker_phone || '', caretaker_email: h.caretaker_email || '',
      room_fee: String(h.room_fee ?? 0), is_active: h.is_active,
    })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, room_fee: Number(form.room_fee), is_active: Boolean(form.is_active) }
    try {
      if (editing) await updateHostel(editing.id, payload)
      else await createHostel(payload)
      pushToast('Saved.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Save failed'), 'error')
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this hostel?')) return
    try {
      await deleteHostel(id)
      pushToast('Deleted.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Delete failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('add')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('code')}</th>
              <th className="px-4 py-3">{t('gender')}</th>
              <th className="px-4 py-3">{t('totalCapacity')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {hostels.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-4 py-3">{h.name}</td>
                <td className="px-4 py-3">{h.code}</td>
                <td className="px-4 py-3">{t(h.gender)}</td>
                <td className="px-4 py-3">{h.total_capacity} ({h.occupied_capacity} {t('occupiedBeds').toLowerCase()})</td>
                <td className="px-4 py-3">{h.is_active ? t('active') : t('inactive')}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEdit(h)} className="rounded-lg bg-slate-100 px-3 py-1">{t('edit')}</button>
                  <button onClick={() => remove(h.id)} className="rounded-lg bg-red-50 px-3 py-1 text-red-700">{t('delete')}</button>
                </td>
              </tr>
            ))}
            {!hostels.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? t('edit') : t('add')} open={open} onClose={() => setOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="hostel-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="hostel-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('name')} className="rounded-xl border px-3 py-2" />
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('code')} className="rounded-xl border px-3 py-2" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-xl border px-3 py-2">
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
            <option value="mixed">{t('mixed')}</option>
          </select>
          <input type="number" min="0" step="0.01" value={form.room_fee} onChange={(e) => setForm({ ...form, room_fee: e.target.value })} placeholder={t('roomFee')} className="rounded-xl border px-3 py-2" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t('location')} className="rounded-xl border px-3 py-2 sm:col-span-2" />
          <input value={form.caretaker_phone} onChange={(e) => setForm({ ...form, caretaker_phone: e.target.value })} placeholder={t('caretakerPhone')} className="rounded-xl border px-3 py-2" />
          <input value={form.caretaker_email} onChange={(e) => setForm({ ...form, caretaker_email: e.target.value })} placeholder={t('caretakerEmail')} className="rounded-xl border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            {t('active')}
          </label>
        </form>
      </Modal>
    </div>
  )
}
