import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import {
  createSubscription, fetchCanteenStudents, fetchCanteenWallets, fetchFeedingPlans,
  topUpWallet, formatCanteenError,
} from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

export default function WalletsPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [wallets, setWallets] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const [activeWallet, setActiveWallet] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [subForm, setSubForm] = useState({ student_id: '', feeding_plan_id: '', pay_from_wallet: true })

  const load = async () => {
    try {
      const res = await fetchCanteenWallets({ search: search || undefined })
      setWallets(res.data?.data?.data || res.data?.data || [])
    } catch (e) {
      pushToast(formatCanteenError(e, 'Failed to load wallets'), 'error')
    }
  }

  useEffect(() => { load() }, [search])

  const openTopUp = (wallet: any) => {
    setActiveWallet(wallet)
    setAmount('')
    setTopUpOpen(true)
  }

  const submitTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWallet) return
    try {
      await topUpWallet(activeWallet.id, { amount: Number(amount) })
      pushToast('Wallet topped up.')
      setTopUpOpen(false)
      load()
    } catch (err) {
      pushToast(formatCanteenError(err, 'Top up failed'), 'error')
    }
  }

  const openSubscribe = async () => {
    const [sRes, pRes] = await Promise.all([fetchCanteenStudents(), fetchFeedingPlans({ active_only: true })])
    setStudents(sRes.data?.data || [])
    setPlans(pRes.data?.data || [])
    setSubForm({ student_id: '', feeding_plan_id: '', pay_from_wallet: true })
    setSubOpen(true)
  }

  const submitSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSubscription(subForm)
      pushToast('Subscription created.')
      setSubOpen(false)
      load()
    } catch (err) {
      pushToast(formatCanteenError(err, 'Subscription failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="max-w-xs rounded-xl border px-3 py-2 text-sm" />
        <button onClick={openSubscribe} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('subscribe')}</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">{t('registrationNumber')}</th>
              <th className="px-4 py-3">{t('walletNumber')}</th>
              <th className="px-4 py-3">{t('balance')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-3">{w.student?.user?.name || '—'}</td>
                <td className="px-4 py-3">{w.student?.registration_number}</td>
                <td className="px-4 py-3 font-mono text-xs">{w.wallet_number}</td>
                <td className="px-4 py-3 font-semibold">{Number(w.balance).toFixed(2)}</td>
                <td className="px-4 py-3"><button onClick={() => openTopUp(w)} className="rounded-lg bg-slate-100 px-3 py-1">{t('topUp')}</button></td>
              </tr>
            ))}
            {!wallets.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={t('topUp')} open={topUpOpen} onClose={() => setTopUpOpen(false)} footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setTopUpOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="topup-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="topup-form" onSubmit={submitTopUp} className="space-y-3">
          <p className="text-sm text-slate-600">{activeWallet?.student?.user?.name} — {activeWallet?.wallet_number}</p>
          <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('amount')} className="w-full rounded-xl border px-3 py-2" />
        </form>
      </Modal>

      <Modal title={t('subscribe')} open={subOpen} onClose={() => setSubOpen(false)} wide footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setSubOpen(false)} className="rounded-xl border px-4 py-2 text-sm">{t('cancel')}</button>
          <button type="submit" form="sub-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('save')}</button>
        </div>
      }>
        <form id="sub-form" onSubmit={submitSubscribe} className="grid gap-4">
          <div><label className="text-sm font-medium">{t('selectStudent')}</label><select required value={subForm.student_id} onChange={(e) => setSubForm({ ...subForm, student_id: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">—</option>{students.map((s) => <option key={s.id} value={s.id}>{s.user?.name} ({s.registration_number})</option>)}</select></div>
          <div><label className="text-sm font-medium">{t('selectPlan')}</label><select required value={subForm.feeding_plan_id} onChange={(e) => setSubForm({ ...subForm, feeding_plan_id: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">—</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.total_meals} meals</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={subForm.pay_from_wallet} onChange={(e) => setSubForm({ ...subForm, pay_from_wallet: e.target.checked })} />{t('payFromWallet')}</label>
        </form>
      </Modal>
    </div>
  )
}
