import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  approveContract,
  downloadContractPdf,
  fetchContract,
  formatContractError,
  rejectContract,
  renewContract,
  sendContract,
} from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { pushToast } = useToast()
  const [contract, setContract] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      setContract(await fetchContract(Number(id)))
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to load contract'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (!contract) return <p className="text-sm text-slate-500">Contract not found.</p>

  const status = String(contract.status)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{String(contract.title)}</h2>
            <p className="mt-1 text-sm text-slate-500">{String(contract.reference_number)} · {String(contract.recipient_name)}</p>
            <p className="mt-1 text-sm capitalize text-slate-600">Status: {status.replace(/_/g, ' ')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['generated', 'draft'].includes(status) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const result = await sendContract(Number(id), { channels: ['email', 'internal'] })
                    pushToast(`Signing link: ${(result as { token?: { url?: string } }).token?.url || 'sent'}`)
                    load()
                  } catch (error) {
                    pushToast(formatContractError(error, 'Send failed'), 'error')
                  }
                }}
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
              >
                Send for Signing
              </button>
            )}
            {status === 'pending_approval' && (
              <>
                <button type="button" onClick={async () => { await approveContract(Number(id)); pushToast('Approved.'); load() }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                <button type="button" onClick={async () => { if (!rejectReason) return pushToast('Enter rejection reason', 'error'); await rejectContract(Number(id), rejectReason); pushToast('Rejected.'); load() }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Reject</button>
              </>
            )}
            {status === 'fully_executed' && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await downloadContractPdf(Number(id))
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${contract.reference_number}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch (error) {
                    pushToast(formatContractError(error, 'Download failed'), 'error')
                  }
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Download PDF
              </button>
            )}
            <button type="button" onClick={async () => { await renewContract(Number(id), {}); pushToast('Renewal contract created.'); load() }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Renew</button>
          </div>
        </div>
        {status === 'pending_approval' && (
          <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason" className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Contract Preview</h3>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: String(contract.body_html || '') }} />
      </div>
    </div>
  )
}
