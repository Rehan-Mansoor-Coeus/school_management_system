import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import { fetchHostelPayments, formatHostelError, recordHostelPayment, waiveHostelPayment } from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function PaymentsPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<any>(null)
  const [form, setForm] = useState({ amount_paid: '', payment_method: 'cash', payment_reference: '' })

  const load = () => fetchHostelPayments().then((res) => setRows(res.data?.data?.data || res.data?.data || [])).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const openRecord = (p: any) => {
    setActive(p)
    setForm({ amount_paid: String(Number(p.amount) - Number(p.amount_paid)), payment_method: 'cash', payment_reference: '' })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active) return
    try {
      await recordHostelPayment(active.id, { ...form, amount_paid: Number(form.amount_paid) })
      pushToast('Payment recorded.')
      setOpen(false)
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Payment failed'), 'error')
    }
  }

  const waive = async (id: number) => {
    if (!window.confirm('Waive this fee?')) return
    try {
      await waiveHostelPayment(id)
      pushToast('Fee waived.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Waive failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">{t('reference')}</th>
              <th className="px-4 py-3">{t('amount')}</th>
              <th className="px-4 py-3">{t('amountPaid')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.student?.user?.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                <td className="px-4 py-3">{Number(p.amount).toFixed(2)}</td>
                <td className="px-4 py-3">{Number(p.amount_paid).toFixed(2)}</td>
                <td className="px-4 py-3">{t(p.status)}</td>
                <td className="px-4 py-3 space-x-2">
                  {['pending', 'partial'].includes(p.status) && (
                    <>
                      <button onClick={() => openRecord(p)} className="rounded-lg bg-slate-100 px-3 py-1">{t('recordPayment')}</button>
                      <button onClick={() => waive(p.id)} className="rounded-lg bg-amber-50 px-3 py-1">{t('waive')}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={t('recordPayment')} open={open} onClose={() => setOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="pay-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="pay-form" onSubmit={submit} className="space-y-3">
          <input required type="number" min="0.01" step="0.01" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} placeholder={t('amountPaid')} className="w-full rounded-xl border px-3 py-2" />
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-xl border px-3 py-2">
            {['cash', 'bank_transfer', 'mobile_money', 'card', 'other'].map((m) => (
              <option key={m} value={m}>{t(m === 'bank_transfer' ? 'bankTransfer' : m === 'mobile_money' ? 'mobileMoney' : m)}</option>
            ))}
          </select>
          <input value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder={t('reference')} className="w-full rounded-xl border px-3 py-2" />
        </form>
      </Modal>
    </div>
  )
}
