import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  createMaintenanceRequest, createRegistration, fetchHostelReference, fetchMyAllocation,
  fetchMyHostelPayments, fetchMyRegistration, formatHostelError,
} from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function MyHostelPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [registration, setRegistration] = useState<any>(null)
  const [allocation, setAllocation] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [hostels, setHostels] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [maintOpen, setMaintOpen] = useState(false)
  const [form, setForm] = useState({ preferred_hostel_id: '', notes: '' })
  const [maintForm, setMaintForm] = useState({ hostel_id: '', title: '', description: '', priority: 'medium' })

  const load = async () => {
    const [regRes, allocRes, payRes, refRes] = await Promise.all([
      fetchMyRegistration().catch(() => ({ data: { data: null } })),
      fetchMyAllocation().catch(() => ({ data: { data: null } })),
      fetchMyHostelPayments().catch(() => ({ data: { data: [] } })),
      fetchHostelReference(),
    ])
    setRegistration(regRes.data?.data)
    setAllocation(allocRes.data?.data)
    setPayments(payRes.data?.data || [])
    setHostels(refRes.data?.data?.hostels || [])
  }

  useEffect(() => { load() }, [])

  const apply = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRegistration({
        preferred_hostel_id: form.preferred_hostel_id ? Number(form.preferred_hostel_id) : undefined,
        notes: form.notes || undefined,
      })
      pushToast('Registration submitted.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Registration failed'), 'error')
    }
  }

  const submitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMaintenanceRequest({ ...maintForm, hostel_id: Number(maintForm.hostel_id) })
      pushToast('Maintenance request submitted.')
      setMaintOpen(false)
    } catch (err) {
      pushToast(formatHostelError(err, 'Submit failed'), 'error')
    }
  }

  const canApply = !registration || registration.status === 'rejected'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('registrations')}</h2>
          {canApply && (
            <button onClick={() => setOpen(true)} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('applyRegistration')}</button>
          )}
        </div>
        {registration ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">{t('status')}</dt><dd className="font-medium">{t(registration.status)}</dd></div>
            <div><dt className="text-slate-500">{t('preferredHostel')}</dt><dd>{registration.preferred_hostel?.name || '—'}</dd></div>
            <div><dt className="text-slate-500">{t('academicYear')}</dt><dd>{registration.academic_year?.name}</dd></div>
            {registration.notes && <div className="sm:col-span-2"><dt className="text-slate-500">{t('notes')}</dt><dd>{registration.notes}</dd></div>}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">{t('noRecords')}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">{t('allocations')}</h2>
        {allocation ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Hostel</dt><dd>{allocation.room?.hostel?.name}</dd></div>
            <div><dt className="text-slate-500">{t('roomNumber')}</dt><dd>{allocation.room?.room_number}</dd></div>
            <div><dt className="text-slate-500">{t('bed')}</dt><dd>{allocation.bed?.bed_label || '—'}</dd></div>
            <div><dt className="text-slate-500">{t('status')}</dt><dd>{t(allocation.status)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500">{t('noRecords')}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">{t('payments')}</h2>
        {payments.length ? (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-slate-100 pb-2">
                <span>{p.reference} — {t(p.status)}</span>
                <span>{Number(p.amount_paid).toFixed(2)} / {Number(p.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t('noRecords')}</p>
        )}
      </div>

      {allocation && (
        <button onClick={() => { setMaintForm({ ...maintForm, hostel_id: String(allocation.room?.hostel_id || '') }); setMaintOpen(true) }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
          Report maintenance issue
        </button>
      )}

      <Modal title={t('applyRegistration')} open={open} onClose={() => setOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="reg-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="reg-form" onSubmit={apply} className="space-y-3">
          <select value={form.preferred_hostel_id} onChange={(e) => setForm({ ...form, preferred_hostel_id: e.target.value })} className="w-full rounded-xl border px-3 py-2">
            <option value="">{t('selectHostel')}</option>
            {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} className="w-full rounded-xl border px-3 py-2" rows={3} />
        </form>
      </Modal>

      <Modal title={t('maintenance')} open={maintOpen} onClose={() => setMaintOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setMaintOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="my-maint-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="my-maint-form" onSubmit={submitMaintenance} className="space-y-3">
          <input required value={maintForm.title} onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })} placeholder={t('title')} className="w-full rounded-xl border px-3 py-2" />
          <textarea required value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} placeholder={t('description')} className="w-full rounded-xl border px-3 py-2" rows={3} />
        </form>
      </Modal>
    </div>
  )
}
