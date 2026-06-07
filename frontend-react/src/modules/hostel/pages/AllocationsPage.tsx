import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  checkInAllocation, createAllocation, fetchHostelStudents, fetchRegistrations, fetchRooms,
  fetchAllocations, formatHostelError, releaseAllocation,
} from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function AllocationsPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<any[]>([])
  const [form, setForm] = useState({ student_id: '', room_id: '', bed_id: '', registration_id: '' })

  const load = () => fetchAllocations().then((res) => setRows(res.data?.data?.data || res.data?.data || [])).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const openAllocate = async () => {
    const [sRes, rRes, regRes] = await Promise.all([
      fetchHostelStudents(),
      fetchRooms({ status: 'available' }),
      fetchRegistrations({ status: 'approved' }),
    ])
    setStudents(sRes.data?.data || [])
    setRooms(rRes.data?.data || [])
    setRegistrations(regRes.data?.data?.data || regRes.data?.data || [])
    setForm({ student_id: '', room_id: '', bed_id: '', registration_id: '' })
    setOpen(true)
  }

  const selectedRoom = rooms.find((r) => String(r.id) === form.room_id)
  const availableBeds = (selectedRoom?.beds || []).filter((b: any) => b.status === 'available')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAllocation({
        student_id: Number(form.student_id),
        room_id: Number(form.room_id),
        bed_id: form.bed_id ? Number(form.bed_id) : undefined,
        registration_id: form.registration_id ? Number(form.registration_id) : undefined,
      })
      pushToast('Allocated.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Allocation failed'), 'error')
    }
  }

  const doCheckIn = async (id: number) => {
    try {
      await checkInAllocation(id)
      pushToast('Checked in.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Check-in failed'), 'error')
    }
  }

  const doRelease = async (id: number) => {
    if (!window.confirm('Release this allocation?')) return
    try {
      await releaseAllocation(id)
      pushToast('Released.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Release failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAllocate} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('allocate')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">Hostel / Room</th>
              <th className="px-4 py-3">{t('bed')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">{a.student?.user?.name}</td>
                <td className="px-4 py-3">{a.room?.hostel?.name} — {a.room?.room_number}</td>
                <td className="px-4 py-3">{a.bed?.bed_label || '—'}</td>
                <td className="px-4 py-3">{t(a.status)}</td>
                <td className="px-4 py-3 space-x-2">
                  {a.status === 'allocated' && <button onClick={() => doCheckIn(a.id)} className="rounded-lg bg-slate-100 px-3 py-1">{t('checkIn')}</button>}
                  {['allocated', 'active'].includes(a.status) && <button onClick={() => doRelease(a.id)} className="rounded-lg bg-amber-50 px-3 py-1">{t('release')}</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={t('allocate')} open={open} onClose={() => setOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="alloc-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="alloc-form" onSubmit={submit} className="grid gap-3">
          <select value={form.registration_id} onChange={(e) => setForm({ ...form, registration_id: e.target.value })} className="rounded-xl border px-3 py-2">
            <option value="">Link approved registration (optional)</option>
            {registrations.map((r) => (
              <option key={r.id} value={r.id}>{r.student?.user?.name} — {r.student?.registration_number}</option>
            ))}
          </select>
          <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="rounded-xl border px-3 py-2">
            <option value="">{t('selectStudent')}</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.user?.name} ({s.registration_number})</option>)}
          </select>
          <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value, bed_id: '' })} className="rounded-xl border px-3 py-2">
            <option value="">{t('selectRoom')}</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.hostel?.name} — {r.room_number} ({r.occupied_beds}/{r.capacity})</option>)}
          </select>
          <select value={form.bed_id} onChange={(e) => setForm({ ...form, bed_id: e.target.value })} className="rounded-xl border px-3 py-2">
            <option value="">{t('selectBed')}</option>
            {availableBeds.map((b: any) => <option key={b.id} value={b.id}>{b.bed_label}</option>)}
          </select>
        </form>
      </Modal>
    </div>
  )
}
