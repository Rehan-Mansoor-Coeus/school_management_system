import { useEffect, useState } from 'react'
import { fetchMyCanteenWallet, fetchMySubscriptions } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import { useToast } from '../../../components/ui/ToastProvider'

export default function MyWalletPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [data, setData] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])

  useEffect(() => {
    Promise.all([fetchMyCanteenWallet(), fetchMySubscriptions()])
      .then(([wRes, sRes]) => {
        setData(wRes.data?.data)
        setSubs(sRes.data?.data || [])
      })
      .catch((e) => pushToast(e?.response?.data?.message || 'Unable to load wallet', 'error'))
  }, [])

  const copyQr = () => {
    if (!data?.qr_payload) return
    navigator.clipboard.writeText(data.qr_payload)
    pushToast(t('copied'))
  }

  if (!data) return <p className="text-slate-500">{t('loading')}</p>

  const wallet = data.wallet

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">{data.student?.user?.name}</h2>
        <p className="text-sm text-slate-500">{data.student?.registration_number}</p>
        <div className="mt-4 text-3xl font-bold text-[#1e3a5f]">{Number(wallet.balance).toFixed(2)}</div>
        <p className="text-sm text-slate-500">{t('balance')}</p>
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">{t('qrCode')}</p>
          <p className="mt-1 break-all font-mono text-sm">{data.qr_payload}</p>
          <button onClick={copyQr} className="mt-3 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs text-white">{t('copyQr')}</button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">Feeding plans</h3>
          {subs.length === 0 ? <p className="text-sm text-slate-500">{t('noRecords')}</p> : subs.map((s) => (
            <div key={s.id} className="mb-3 rounded-xl border p-3 text-sm">
              <div className="font-medium">{s.feeding_plan?.name}</div>
              <div className="text-slate-500">{t('mealsRemaining')}: {s.meals_remaining}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold">Recent transactions</h3>
          {(wallet.transactions || []).map((tx: any) => (
            <div key={tx.id} className="flex justify-between border-b py-2 text-sm">
              <span className="capitalize">{tx.type} — {tx.source}</span>
              <span className={tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}>{tx.type === 'credit' ? '+' : '-'}{Number(tx.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
