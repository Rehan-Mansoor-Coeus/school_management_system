import { useEffect, useState } from 'react'
import {
  DocumentWorkflowSettings,
  fetchContractTemplates,
  fetchDocumentSettings,
  fetchDocumentTypes,
  formatContractError,
  updateDocumentSettings,
} from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'

const CHANNELS: Array<{ key: string; label: string }> = [
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'internal', label: 'Internal (in-app log)' },
]

export default function DocumentSettingsPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['documents.settings.manage', 'documents.manage'] })

  const [stats, setStats] = useState({ types: 0, activeTypes: 0, templates: 0 })
  const [settings, setSettings] = useState<DocumentWorkflowSettings | null>(null)
  const [daysInput, setDaysInput] = useState('90, 60')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const [types, templates, cfg] = await Promise.all([
          fetchDocumentTypes({}),
          fetchContractTemplates(),
          fetchDocumentSettings().catch(() => null),
        ])
        const typeList = types as Array<{ is_active: boolean }>
        setStats({
          types: typeList.length,
          activeTypes: typeList.filter((t) => t.is_active).length,
          templates: (templates as unknown[]).length,
        })
        if (cfg) {
          setSettings(cfg)
          setDaysInput((cfg.expiry_alert_days || []).join(', '))
        }
      } catch (error) {
        pushToast(formatContractError(error, 'Failed to load settings'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [pushToast])

  const toggleChannel = (key: string) => {
    if (!settings) return
    const current = settings.expiry_alert_channels || []
    const next = current.includes(key) ? current.filter((c) => c !== key) : [...current, key]
    setSettings({ ...settings, expiry_alert_channels: next })
  }

  const save = async () => {
    if (!settings) return
    const days = Array.from(
      new Set(
        daysInput
          .split(/[,;\s]+/)
          .map((v) => parseInt(v, 10))
          .filter((v) => Number.isFinite(v) && v > 0),
      ),
    ).sort((a, b) => b - a)

    if (days.length === 0) {
      pushToast('Enter at least one valid lead time in days (e.g. 90, 60).', 'error')
      return
    }

    setSaving(true)
    try {
      const updated = await updateDocumentSettings({
        expiry_alerts_enabled: settings.expiry_alerts_enabled,
        expiry_alert_days: days,
        expiry_alert_channels: settings.expiry_alert_channels,
        expiry_alert_recipients: settings.expiry_alert_recipients || '',
      })
      setSettings(updated)
      setDaysInput((updated.expiry_alert_days || []).join(', '))
      pushToast('Expiry alert settings saved.', 'success')
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to save settings'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Document Types</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.types}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Types</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.activeTypes}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Templates</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.templates}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Expiry &amp; Renewal Alerts (License Settings)</h2>
            <p className="mt-1 text-xs text-slate-500">
              Automatic reminders are sent before a document expires, at each configured lead time. A daily job evaluates
              documents that have an end date.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : !settings ? (
          <p className="mt-4 text-sm text-slate-500">Settings are unavailable.</p>
        ) : (
          <div className="mt-5 space-y-5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={settings.expiry_alerts_enabled}
                disabled={!canManage}
                onChange={(e) => setSettings({ ...settings, expiry_alerts_enabled: e.target.checked })}
              />
              <span className="text-sm font-medium text-slate-700">Enable automated expiry alerts</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700">Alert lead times (days before expiry)</label>
              <input
                type="text"
                value={daysInput}
                disabled={!canManage}
                onChange={(e) => setDaysInput(e.target.value)}
                placeholder="90, 60"
                className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Comma-separated. Defaults to 90 and 60 days. Each document is alerted once per threshold.
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700">Alert channels</span>
              <div className="mt-2 flex flex-wrap gap-4">
                {CHANNELS.map((ch) => (
                  <label key={ch.key} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={(settings.expiry_alert_channels || []).includes(ch.key)}
                      disabled={!canManage}
                      onChange={() => toggleChannel(ch.key)}
                    />
                    {ch.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Additional alert recipients</label>
              <input
                type="text"
                value={settings.expiry_alert_recipients || ''}
                disabled={!canManage}
                onChange={(e) => setSettings({ ...settings, expiry_alert_recipients: e.target.value })}
                placeholder="hr@school.edu, registry@school.edu"
                className="mt-1 w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional. Comma-separated emails notified in addition to the document recipient.
              </p>
            </div>

            {canManage && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">How the engine works</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Every document type defines its own signatories, approvers, uploads, and custom fields.</li>
          <li>Generation pulls data automatically from Students, HR/Payroll, and User records.</li>
          <li>Each signatory receives a unique, tokenized, expiring public signing link — no login required.</li>
          <li>Once all required signatures and approvals are complete, a final PDF with QR verification is generated.</li>
          <li>Documents with an end date trigger automatic expiry reminders at the lead times configured above.</li>
          <li>All access is permission-based (View, Edit, Delete) — manage it under Roles &amp; Permissions.</li>
        </ul>
      </div>
    </div>
  )
}
