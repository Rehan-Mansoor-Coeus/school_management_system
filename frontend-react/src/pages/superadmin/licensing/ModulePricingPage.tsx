import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { fetchModulePricing, updateModulePricing, type ModuleCommercial } from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

function fieldClass() {
  return 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

export default function ModulePricingPage() {
  const [rows, setRows] = useState<ModuleCommercial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, ModuleCommercial>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchModulePricing()
      const data = res.data.data || []
      setRows(data)
      const map: Record<number, ModuleCommercial> = {}
      data.forEach((row) => {
        map[row.id] = { ...row }
      })
      setDrafts(map)
    } catch (err) {
      setError(formatApiError(err, 'Unable to load module pricing.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function updateDraft(id: number, patch: Partial<ModuleCommercial>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function toggleDependency(moduleId: number, depId: number) {
    const current = drafts[moduleId]?.depends_on_module_ids || []
    const next = current.includes(depId) ? current.filter((x) => x !== depId) : [...current, depId]
    updateDraft(moduleId, { depends_on_module_ids: next })
  }

  async function saveRow(id: number) {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    setMessage('')
    try {
      await updateModulePricing(id, {
        monthly_price: draft.monthly_price,
        quarterly_price: draft.quarterly_price,
        six_month_price: draft.six_month_price,
        yearly_price: draft.yearly_price,
        one_time_price: draft.one_time_price,
        setup_fee: draft.setup_fee,
        is_free: draft.is_free,
        is_mandatory: draft.is_mandatory,
        can_purchase_separately: draft.can_purchase_separately,
        trial_available: draft.trial_available,
        depends_on_module_ids: draft.depends_on_module_ids,
      })
      setMessage(`${draft.name} updated.`)
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Could not save module pricing.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
          {' / '}Module pricing
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Module Pricing</h1>
        <p className="mt-1 text-sm text-slate-500">Set commercial prices and dependencies used by modular plans and the assign wizard.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const draft = drafts[row.id] || row
            return (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{row.name}</h2>
                    <p className="text-xs text-slate-500">{row.key}</p>
                  </div>
                  <button
                    type="button"
                    disabled={savingId === row.id}
                    onClick={() => saveRow(row.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <label className="text-xs text-slate-500">Monthly<input className={fieldClass()} type="number" min={0} value={draft.monthly_price ?? ''} onChange={(e) => updateDraft(row.id, { monthly_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                  <label className="text-xs text-slate-500">Quarterly<input className={fieldClass()} type="number" min={0} value={draft.quarterly_price ?? ''} onChange={(e) => updateDraft(row.id, { quarterly_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                  <label className="text-xs text-slate-500">6 months<input className={fieldClass()} type="number" min={0} value={draft.six_month_price ?? ''} onChange={(e) => updateDraft(row.id, { six_month_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                  <label className="text-xs text-slate-500">Yearly<input className={fieldClass()} type="number" min={0} value={draft.yearly_price ?? ''} onChange={(e) => updateDraft(row.id, { yearly_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                  <label className="text-xs text-slate-500">One-time<input className={fieldClass()} type="number" min={0} value={draft.one_time_price ?? ''} onChange={(e) => updateDraft(row.id, { one_time_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                  <label className="text-xs text-slate-500">Setup fee<input className={fieldClass()} type="number" min={0} value={draft.setup_fee ?? ''} onChange={(e) => updateDraft(row.id, { setup_fee: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.is_free} onChange={(e) => updateDraft(row.id, { is_free: e.target.checked })} /> Free</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.is_mandatory} onChange={(e) => updateDraft(row.id, { is_mandatory: e.target.checked })} /> Mandatory</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.can_purchase_separately} onChange={(e) => updateDraft(row.id, { can_purchase_separately: e.target.checked })} /> Can buy separately</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.trial_available} onChange={(e) => updateDraft(row.id, { trial_available: e.target.checked })} /> Trial available</label>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Depends on</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rows.filter((m) => m.id !== row.id).map((m) => (
                      <label key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={(draft.depends_on_module_ids || []).includes(m.id)}
                          onChange={() => toggleDependency(row.id, m.id)}
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
