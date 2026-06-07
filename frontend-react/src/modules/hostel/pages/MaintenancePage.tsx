import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import { createMaintenanceRequest, fetchHostelReference, fetchMaintenanceRequests, formatHostelError, updateMaintenanceRequest } from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function MaintenancePage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [hostels, setHostels] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ hostel_id: '', title: '', description: '', priority: 'medium' })

  const load = async () => {
    const [mRes, refRes] = await Promise.all([fetchMaintenanceRequests(), fetchHostelReference()])
    setRows(mRes.data?.data?.data || mRes.data?.data || [])
    setHostels(refRes.data?.data?.hostels || [])
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMaintenanceRequest({ ...form, hostel_id: Number(form.hostel_id) })
      pushToast('Request submitted.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Submit failed'), 'error')
    }
  }

  const setStatus = async (id: number, status: string) => {
    try {
      await updateMaintenanceRequest(id, { status })
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Update failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('add')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('title')}</th>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('priority')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3">{m.title}</td>
                <td className="px-4 py-3">{m.hostel?.name}</td>
                <td className="px-4 py-3">{t(m.priority)}</td>
                <td className="px-4 py-3">{t(m.status === 'in_progress' ? 'inProgress' : m.status)}</td>
                <td className="px-4 py-3 space-x-2">
                  {m.status === 'open' && <button onClick={() => setStatus(m.id, 'in_progress')} className="rounded-lg bg-slate-100 px-3 py-1">{t('inProgress')}</button>}
                  {m.status === 'in_progress' && <button onClick={() => setStatus(m.id, 'completed')} className="rounded-lg bg-green-50 px-3 py-1">{t('completed')}</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={t('maintenance')} open={open} onClose={() => setOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="maint-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="maint-form" onSubmit={submit} className="space-y-3">
          <select required value={form.hostel_id} onChange={(e) => setForm({ ...form, hostel_id: e.target.value })} className="w-full rounded-xl border px-3 py-2">
            <option value="">{t('selectHostel')}</option>
            {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('title')} className="w-full rounded-xl border px-3 py-2" />
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('description')} className="w-full rounded-xl border px-3 py-2" rows={3} />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border px-3 py-2">
            {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </select>
        </form>
      </Modal>
    </div>
  )
}
