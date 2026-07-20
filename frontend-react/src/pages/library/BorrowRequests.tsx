import { useEffect, useState } from 'react'
import { Inbox, Check, X, QrCode, BookCopy, ScanLine } from 'lucide-react'
import {
  fetchBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  issueBorrowRequest,
  cancelBorrowRequest,
  scanBorrowToken,
  type BorrowRequest,
} from '../../api/library'
import { Button, Card, EmptyState, Field, PageHeader, Spinner, StatusBadge, TableWrap, inputClass, tdClass, thClass } from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import QrImage from '../../components/library/QrImage'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import { ColoredTabsBar, type TabColor } from '../../components/ui/ColoredModuleTabsNav'

const STATUS_TABS: { id: string; color: TabColor }[] = [
  { id: 'pending', color: 'amber' },
  { id: 'approved', color: 'emerald' },
  { id: 'issued', color: 'blue' },
  { id: 'rejected', color: 'rose' },
  { id: 'all', color: 'navy' },
]

export default function BorrowRequests() {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState<BorrowRequest[]>([])
  const [qrTarget, setQrTarget] = useState<BorrowRequest | null>(null)
  const [issueTarget, setIssueTarget] = useState<BorrowRequest | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [scanOpen, setScanOpen] = useState(false)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)

  const canApprove = hasPermission('approve_borrow_requests')
  const canReject = hasPermission('reject_borrow_requests')
  const canIssue = hasPermission('issue_books')

  async function load() {
    setLoading(true)
    try {
      const res = await fetchBorrowRequests({ status: tab === 'all' ? undefined : tab })
      setRows(res.data)
    } catch {
      pushToast('Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tab])

  async function approve(r: BorrowRequest) {
    setBusy(true)
    try {
      const res = await approveBorrowRequest(r.id)
      pushToast('Request approved', 'success')
      setQrTarget(res.data)
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to approve', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function reject(r: BorrowRequest) {
    const reason = window.prompt('Reason for rejection (optional):') || ''
    try {
      await rejectBorrowRequest(r.id, reason)
      pushToast('Request rejected', 'success')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to reject', 'error')
    }
  }

  async function confirmIssue() {
    if (!issueTarget) return
    setBusy(true)
    try {
      await issueBorrowRequest(issueTarget.id, dueDate ? { due_date: dueDate } : {})
      pushToast('Book issued', 'success')
      setIssueTarget(null)
      setDueDate('')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to issue', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function cancel(r: BorrowRequest) {
    if (!window.confirm('Cancel this request?')) return
    try {
      await cancelBorrowRequest(r.id)
      pushToast('Request cancelled', 'success')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to cancel', 'error')
    }
  }

  async function doScan() {
    if (!token.trim()) return
    setBusy(true)
    try {
      const res = await scanBorrowToken(token.trim())
      setScanOpen(false)
      setToken('')
      setIssueTarget(res.data)
      setDueDate('')
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Approval notice not found', 'error')
    } finally {
      setBusy(false)
    }
  }

  function qrPayload(r: BorrowRequest) {
    return JSON.stringify({
      token: r.token,
      borrow_request_id: r.id,
      user_id: r.user_id,
      book_id: r.book_id,
      url: `${window.location.origin}/library/requests`,
    })
  }

  return (
    <div>
      <PageHeader
        title="Borrow Requests"
        subtitle="Review, approve and issue book requests"
        icon={Inbox}
        actions={
          canIssue ? (
            <Button variant="secondary" onClick={() => setScanOpen(true)}>
              <ScanLine className="h-4 w-4" /> Scan / Enter QR
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <ColoredTabsBar
          items={STATUS_TABS.map((s) => ({
            id: s.id,
            label: s.id.charAt(0).toUpperCase() + s.id.slice(1),
            color: s.color,
          }))}
          activeId={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message="No requests found." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Borrower</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Copy</th>
              <th className={thClass}>From</th>
              <th className={thClass}>Return by</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{r.user_name || `User #${r.user_id}`}</td>
                <td className={tdClass}>{r.book_title}</td>
                <td className={tdClass}>{r.copy_code || '—'}</td>
                <td className={tdClass}>{r.requested_from_datetime?.slice(0, 10) || '—'}</td>
                <td className={tdClass}>{r.expected_return_date || '—'}</td>
                <td className={tdClass}><StatusBadge status={r.status} /></td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {r.status === 'pending' && canApprove && (
                      <Button onClick={() => approve(r)} disabled={busy}><Check className="h-4 w-4" /> Approve</Button>
                    )}
                    {r.status === 'pending' && canReject && (
                      <Button variant="danger" onClick={() => reject(r)}><X className="h-4 w-4" /> Reject</Button>
                    )}
                    {r.status === 'approved' && (
                      <>
                        <Button variant="secondary" onClick={() => setQrTarget(r)}><QrCode className="h-4 w-4" /> QR</Button>
                        {canIssue && (
                          <Button onClick={() => { setIssueTarget(r); setDueDate(r.expected_return_date || '') }}>
                            <BookCopy className="h-4 w-4" /> Issue
                          </Button>
                        )}
                      </>
                    )}
                    {['pending', 'approved'].includes(r.status) && (
                      <Button variant="ghost" onClick={() => cancel(r)}>Cancel</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {/* Approval notice / QR */}
      <Modal title="Approval Notice" open={Boolean(qrTarget)} onClose={() => setQrTarget(null)}>
        {qrTarget ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-slate-600">
              Present this QR code at the library to collect <strong>{qrTarget.book_title}</strong>.
            </p>
            <QrImage value={qrPayload(qrTarget)} size={220} />
            <div className="rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600">{qrTarget.token}</div>
            <p className="text-xs text-slate-500">Borrower: {qrTarget.user_name} · Return by {qrTarget.expected_return_date || '—'}</p>
          </div>
        ) : null}
      </Modal>

      {/* Issue confirmation */}
      <Modal
        title="Issue Book"
        open={Boolean(issueTarget)}
        onClose={() => setIssueTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIssueTarget(null)}>Cancel</Button>
            <Button onClick={confirmIssue} disabled={busy}>{busy ? 'Issuing…' : 'Confirm Issue'}</Button>
          </div>
        }
      >
        {issueTarget ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <div><span className="text-slate-400">Book:</span> {issueTarget.book_title}</div>
              <div><span className="text-slate-400">Borrower:</span> {issueTarget.user_name}</div>
              <div><span className="text-slate-400">Copy:</span> {issueTarget.copy_code || '—'}</div>
              <div><span className="text-slate-400">Status:</span> <StatusBadge status={issueTarget.status} /></div>
            </div>
            {issueTarget.status !== 'approved' && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                This request is "{issueTarget.status}". Only approved requests can be issued.
              </div>
            )}
            <Field label="Due date (return by)">
              <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </Modal>

      {/* Scan token */}
      <Modal
        title="Scan / Enter Approval QR"
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setScanOpen(false)}>Cancel</Button>
            <Button onClick={doScan} disabled={busy}>Open Request</Button>
          </div>
        }
      >
        <Field label="Approval token">
          <input className={inputClass} placeholder="Paste the token from the QR code" value={token} onChange={(e) => setToken(e.target.value)} />
        </Field>
        <p className="mt-2 text-xs text-slate-500">Scan the borrower's QR with any scanner and paste the contained token here.</p>
      </Modal>
    </div>
  )
}
