import { useEffect, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import {
  downloadCanteenInvoice,
  fetchCanteenSales,
  formatCanteenError,
  printCanteenReceipt,
} from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import { useToast } from '../../../components/ui/ToastProvider'

export default function SalesPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await fetchCanteenSales({
        page: p,
        search: search || undefined,
        payment_method: paymentMethod || undefined,
      })
      setRows(res.data?.data?.data || [])
      setMeta(res.data?.data)
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to load sales'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
  }, [page])

  const printReceipt = async (orderId: number) => {
    try {
      await printCanteenReceipt(orderId)
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to print receipt'), 'error')
    }
  }

  const downloadInvoice = async (orderId: number, invoiceNumber?: string) => {
    try {
      await downloadCanteenInvoice(orderId, invoiceNumber)
    } catch (err) {
      pushToast(formatCanteenError(err, 'Unable to download invoice'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('salesRecords')}</h2>
        <p className="text-sm text-slate-500">{t('salesRecordsSubtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchSales')}
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">{t('allPaymentMethods')}</option>
          <option value="cash">{t('payCash')}</option>
          <option value="stripe">{t('payStripe')}</option>
          <option value="campay">{t('payCampay')}</option>
          <option value="deposit">{t('payDeposit')}</option>
          <option value="credit">{t('payCredit')}</option>
          <option value="pay_later">{t('payLater')}</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setPage(1)
            load(1)
          }}
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
        >
          {t('search')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('orderNumber')}</th>
              <th className="px-4 py-3 font-semibold">{t('invoiceNumber')}</th>
              <th className="px-4 py-3 font-semibold">{t('student')}</th>
              <th className="px-4 py-3 font-semibold">{t('total')}</th>
              <th className="px-4 py-3 font-semibold">{t('paymentMethod')}</th>
              <th className="px-4 py-3 font-semibold">{t('status')}</th>
              <th className="px-4 py-3 font-semibold">{t('date')}</th>
              <th className="px-4 py-3 font-semibold">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t('loading')}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t('noRecords')}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{row.order_number}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.invoice_number || '—'}</td>
                  <td className="px-4 py-3">{row.student?.user?.name || t('guestSale')}</td>
                  <td className="px-4 py-3 font-semibold">{Number(row.total).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{String(row.payment_method || '').replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {row.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {row.completed_at ? new Date(row.completed_at).toLocaleString() : new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'completed' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => printReceipt(row.id)}
                          className="inline-flex items-center gap-1 text-[#1e3a5f] hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {t('printReceipt')}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadInvoice(row.id, row.invoice_number)}
                          className="text-slate-500 hover:underline text-xs"
                        >
                          {t('downloadInvoice')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
