import { useEffect, useState } from 'react'
import {
  archiveContractTemplate,
  cloneContractTemplate,
  createContractTemplate,
  fetchContractTemplates,
  formatContractError,
} from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

type Template = {
  id: number
  name: string
  code: string
  category: string
  recipient_type: string
  is_active: boolean
  body_html: string
}

const defaultBody = `<div class="contract-section"><h3>1. Agreement</h3><p>This agreement is between <strong>{{institution_name}}</strong> and <strong>{{full_name}}</strong>.</p></div>`

export default function ContractTemplatesPage() {
  const { pushToast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'general',
    recipient_type: 'staff',
    body_html: defaultBody,
  })

  const load = async () => {
    setLoading(true)
    try {
      setTemplates((await fetchContractTemplates()) as Template[])
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to load templates'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createContractTemplate(form)
      pushToast('Template created.')
      setShowForm(false)
      setForm({ name: '', category: 'general', recipient_type: 'staff', body_html: defaultBody })
      load()
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to create template'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
          {showForm ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            required
            placeholder="Template name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {['student', 'teacher', 'staff', 'general'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.recipient_type} onChange={(e) => setForm({ ...form, recipient_type: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {['student', 'teacher', 'staff', 'contract_staff', 'daily_paid', 'temporary', 'other'].map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <textarea
            required
            rows={8}
            value={form.body_html}
            onChange={(e) => setForm({ ...form, body_html: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            placeholder="HTML body with {{merge_fields}}"
          />
          <p className="text-xs text-slate-500">Use merge fields like {'{{full_name}}'}, {'{{employee_number}}'}, {'{{monthly_rate}}'}.</p>
          <button type="submit" className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Save Template</button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : templates.map((tpl) => (
          <div key={tpl.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{tpl.code} · {tpl.category} · {tpl.recipient_type}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${tpl.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {tpl.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await cloneContractTemplate(tpl.id)
                    pushToast('Template cloned.')
                    load()
                  } catch (error) {
                    pushToast(formatContractError(error, 'Clone failed'), 'error')
                  }
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Clone
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await archiveContractTemplate(tpl.id)
                    pushToast('Template archived.')
                    load()
                  } catch (error) {
                    pushToast(formatContractError(error, 'Archive failed'), 'error')
                  }
                }}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
              >
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
