import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import {
  approveInstitutionRequest,
  fetchInstitutionRequestsHub,
  rejectInstitutionRequest,
  type InstitutionRequestHubRow,
  type InstitutionRequestHubTab,
} from '../api/landing'
import { fetchLicensePlans, type LicensePlan } from '../api/licensing'
import { recordSchoolLicensePayment, updateSchoolLicense } from '../api/superadmin'
import Modal from '../components/ui/Modal'
import { FormField, formInputClass } from '../components/ui/FormField'
import { useToast } from '../components/ui/ToastProvider'
import { ColoredTabsBar, type TabColor } from '../components/ui/ColoredModuleTabsNav'

const TABS: { id: InstitutionRequestHubTab; label: string; color: TabColor }[] = [
  { id: 'all', label: 'All Institutions', color: 'navy' },
  { id: 'awaiting', label: 'Awaiting Acceptance', color: 'amber' },
  { id: 'pending_payment', label: 'Pending Payment', color: 'orange' },
  { id: 'approved', label: 'Approved Institutions', color: 'emerald' },
]

const STATUS_OPTIONS = [
  'pending_payment',
  'active',
  'trial',
  'suspended',
  'expired',
  'grace_period',
  'overdue',
  'draft',
]

function money(amount?: number | null, currency?: string | null) {
  const cur = currency || 'USD'
  const value = Number(amount ?? 0)
  return `${cur} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function planActivatesImmediately(plan?: LicensePlan | null) {
  return !!plan && (plan.license_type === 'free' || plan.license_type === 'per_student_semester')
}

export default function InstitutionRequestsPage() {
  const { pushToast } = useToast()
  const [tab, setTab] = useState<InstitutionRequestHubTab>('awaiting')
  const [items, setItems] = useState<InstitutionRequestHubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  const [approveRow, setApproveRow] = useState<InstitutionRequestHubRow | null>(null)
  const [planId, setPlanId] = useState<string>('')
  const [approving, setApproving] = useState(false)

  const [statusRow, setStatusRow] = useState<InstitutionRequestHubRow | null>(null)
  const [statusValue, setStatusValue] = useState('pending_payment')
  const [savingStatus, setSavingStatus] = useState(false)

  const [paymentRow, setPaymentRow] = useState<InstitutionRequestHubRow | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchInstitutionRequestsHub({
        tab,
        search: search.trim() || undefined,
        per_page: 50,
      })
      setItems(res.data?.data || [])
    } catch {
      pushToast('Unable to load institution requests.', 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    fetchLicensePlans({ active_only: true })
      .then((res) => setPlans(res.data?.data || []))
      .catch(() => setPlans([]))
  }, [])

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === planId) || null,
    [plans, planId],
  )

  async function submitApprove() {
    if (!approveRow || !planId) {
      pushToast('Select a license plan.', 'error')
      return
    }
    setApproving(true)
    try {
      const res = await approveInstitutionRequest(approveRow.id, {
        license_plan_id: Number(planId),
      })
      const immediate = res.data?.requires_upfront_payment === false
      pushToast(
        immediate
          ? 'Approved and activated (no upfront payment required).'
          : 'Approved — institution moved to Pending Payment.',
        'success',
      )
      setApproveRow(null)
      setPlanId('')
      setTab(immediate ? 'approved' : 'pending_payment')
    } catch {
      pushToast('Unable to approve request.', 'error')
    } finally {
      setApproving(false)
    }
  }

  async function reject(id: number) {
    try {
      await rejectInstitutionRequest(id)
      pushToast('Request rejected.')
      load()
    } catch {
      pushToast('Unable to reject request.', 'error')
    }
  }

  async function saveStatus() {
    if (!statusRow?.institution_id) return
    setSavingStatus(true)
    try {
      await updateSchoolLicense(statusRow.institution_id, {
        subscription_status: statusValue,
      })
      pushToast('Status updated.', 'success')
      setStatusRow(null)
      load()
    } catch {
      pushToast('Unable to update status.', 'error')
    } finally {
      setSavingStatus(false)
    }
  }

  async function savePayment() {
    if (!paymentRow?.institution_id) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      pushToast('Enter a valid payment amount.', 'error')
      return
    }
    setSavingPayment(true)
    try {
      await recordSchoolLicensePayment(paymentRow.institution_id, {
        amount,
        note: paymentNote.trim() || undefined,
      })
      pushToast('Payment recorded.', 'success')
      setPaymentRow(null)
      setPaymentAmount('')
      setPaymentNote('')
      load()
    } catch {
      pushToast('Unable to record payment.', 'error')
    } finally {
      setSavingPayment(false)
    }
  }

  function openApprove(row: InstitutionRequestHubRow) {
    setApproveRow(row)
    setPlanId(plans[0] ? String(plans[0].id) : '')
  }

  function openStatus(row: InstitutionRequestHubRow) {
    setMenuOpenId(null)
    setStatusRow(row)
    setStatusValue(row.license?.license_status || row.status || 'pending_payment')
  }

  function openPayment(row: InstitutionRequestHubRow) {
    setMenuOpenId(null)
    setPaymentRow(row)
    const balance = Number(row.license?.balance ?? 0)
    setPaymentAmount(balance > 0 ? String(balance) : '')
    setPaymentNote('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institution Registration Requests</h1>
        <p className="text-sm text-slate-500">
          Review onboarding requests, assign license plans, and track payment through activation.
        </p>
      </div>

      <ColoredTabsBar
        items={TABS.map((t) => ({ id: t.id, label: t.label, color: t.color }))}
        activeId={tab}
        onChange={(id) => setTab(id as InstitutionRequestHubTab)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          className={`${formInputClass} max-w-sm`}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load()
          }}
        />
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">{tab === 'awaiting' ? 'Contact' : 'Plan / Payment'}</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.name}</div>
                    {row.code ? <div className="text-xs text-slate-500">{row.code}</div> : null}
                    {(row.city || row.country) && (
                      <div className="text-xs text-slate-500">
                        {[row.city, row.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tab === 'awaiting' ? (
                      <>
                        {row.contact_person}
                        <br />
                        <span className="text-slate-500">{row.email}</span>
                      </>
                    ) : (
                      <>
                        <div>{row.license?.plan_name || row.license?.plan?.name || '—'}</div>
                        <div className="text-xs text-slate-500">
                          Paid {money(row.license?.amount_paid, row.license?.currency)}
                          {' / '}
                          {money(row.license?.total_amount, row.license?.currency)}
                          {typeof row.license?.balance === 'number' && row.license.balance > 0
                            ? ` · Balance ${money(row.license.balance, row.license.currency)}`
                            : ''}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {row.license?.payment_status && tab !== 'awaiting' ? (
                      <span>
                        {(row.license.license_status || row.status || '').replace(/_/g, ' ')}
                        <span className="block text-xs text-slate-500">
                          {(row.license.payment_status || '').replace(/_/g, ' ')}
                        </span>
                      </span>
                    ) : (
                      (row.status || '—').replace(/_/g, ' ')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tab === 'awaiting' && row.kind === 'request' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-100 px-3 py-1 text-emerald-800"
                          onClick={() => openApprove(row)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-rose-100 px-3 py-1 text-rose-800"
                          onClick={() => reject(row.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}

                    {tab === 'pending_payment' && row.institution_id ? (
                      <div className="relative inline-block">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)}
                        >
                          Actions <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpenId === row.id ? (
                          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            <Link
                              to={`/super-admin/institutions/${row.institution_id}`}
                              className="block px-3 py-2 text-left hover:bg-slate-50"
                              onClick={() => setMenuOpenId(null)}
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                              onClick={() => openStatus(row)}
                            >
                              Change status
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                              onClick={() => openPayment(row)}
                            >
                              Add payment
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {(tab === 'all' || tab === 'approved') && row.institution_id ? (
                      <Link
                        to={`/super-admin/institutions/${row.institution_id}`}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
                      >
                        View
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
            {!loading && !items.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No records in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="Approve institution request"
        open={!!approveRow}
        onClose={() => {
          if (!approving) setApproveRow(null)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={approving}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium"
              onClick={() => setApproveRow(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={approving || !planId}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={submitApprove}
            >
              {approving ? 'Approving…' : 'Approve & create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">
            Approving <span className="font-semibold">{approveRow?.name}</span> will create the institution and assign the selected license plan.
          </p>
          <FormField label="License plan" required>
            <select
              className={formInputClass}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Select plan…</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.license_type.replace(/_/g, ' ')})
                  {plan.base_price ? ` — ${plan.currency} ${plan.base_price}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          {planActivatesImmediately(selectedPlan) ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              This plan activates immediately. Per-student plans are billed after student counts are known — no Pending Payment step.
            </p>
          ) : selectedPlan ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This plan requires upfront payment. The institution will appear under Pending Payment until the balance is cleared.
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="Change status"
        open={!!statusRow}
        onClose={() => {
          if (!savingStatus) setStatusRow(null)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm" onClick={() => setStatusRow(null)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={savingStatus}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={saveStatus}
            >
              {savingStatus ? 'Saving…' : 'Save status'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">{statusRow?.name}</p>
          <FormField label="License status">
            <select className={formInputClass} value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>

      <Modal
        title="Add payment"
        open={!!paymentRow}
        onClose={() => {
          if (!savingPayment) setPaymentRow(null)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm" onClick={() => setPaymentRow(null)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={savingPayment}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={savePayment}
            >
              {savingPayment ? 'Saving…' : 'Record payment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <div className="font-medium">{paymentRow?.name}</div>
            <div>
              Total {money(paymentRow?.license?.total_amount, paymentRow?.license?.currency)}
              {' · '}
              Paid {money(paymentRow?.license?.amount_paid, paymentRow?.license?.currency)}
              {' · '}
              Balance {money(paymentRow?.license?.balance, paymentRow?.license?.currency)}
            </div>
          </div>
          <FormField label="Amount" required>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={formInputClass}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </FormField>
          <FormField label="Note">
            <input
              className={formInputClass}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Optional reference"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
