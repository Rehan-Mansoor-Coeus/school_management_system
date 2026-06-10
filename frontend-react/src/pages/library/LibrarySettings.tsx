import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { fetchLibrarySettings, saveLibrarySettings, type LibrarySettings as Settings } from '../../api/library'
import { Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/library/LibraryUi'
import { useToast } from '../../components/ui/ToastProvider'

const TOGGLES: { key: keyof Settings; label: string }[] = [
  { key: 'require_approval', label: 'Require approval before borrowing' },
  { key: 'allow_unlimited_borrowing', label: 'Allow unlimited borrowing' },
  { key: 'block_borrow_on_unpaid_fines', label: 'Block borrowing when fines are unpaid' },
  { key: 'isbn_mandatory', label: 'ISBN mandatory' },
  { key: 'author_mandatory', label: 'Author mandatory' },
  { key: 'publisher_mandatory', label: 'Publisher mandatory' },
  { key: 'publication_year_mandatory', label: 'Publication year mandatory' },
  { key: 'shelf_location_mandatory', label: 'Shelf location mandatory' },
  { key: 'whatsapp_notifications_enabled', label: 'WhatsApp notifications enabled' },
  { key: 'email_notifications_enabled', label: 'Email notifications enabled' },
]

const NUMBERS: { key: keyof Settings; label: string; step?: string }[] = [
  { key: 'max_borrow_days', label: 'Maximum borrowing duration (days)' },
  { key: 'max_books_per_user', label: 'Max books a user can borrow at once' },
  { key: 'fine_per_day', label: 'Fine amount per overdue day', step: '0.01' },
  { key: 'grace_period_days', label: 'Grace period (days)' },
  { key: 'default_reminder_days', label: 'Default reminder days before return' },
]

export default function LibrarySettings() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Settings | null>(null)

  useEffect(() => {
    fetchLibrarySettings()
      .then((res) => setForm(res.data))
      .catch(() => pushToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function update(key: keyof Settings, value: any) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  async function save() {
    if (!form) return
    setSaving(true)
    try {
      const res = await saveLibrarySettings(form)
      setForm(res.data)
      pushToast('Settings saved', 'success')
    } catch {
      pushToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Library Settings"
        subtitle="Rules applied to this institution's library"
        icon={SettingsIcon}
        actions={
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Borrowing Rules</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {NUMBERS.map((n) => (
              <Field key={String(n.key)} label={n.label}>
                <input
                  type="text"
                  inputMode={n.step ? 'decimal' : 'numeric'}
                  className={inputClass}
                  value={String((form as any)[n.key] ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      update(n.key, n.step ? 0 : 0)
                      return
                    }
                    if (n.step) {
                      if (/^\d*\.?\d*$/.test(raw)) update(n.key, raw === '.' ? 0 : Number(raw))
                    } else if (/^\d*$/.test(raw)) {
                      update(n.key, raw === '' ? 0 : parseInt(raw, 10))
                    }
                  }}
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Options</h2>
          <div className="space-y-2">
            {TOGGLES.map((t) => (
              <label key={String(t.key)} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                <span className="text-sm text-slate-700">{t.label}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-[#1e3a5f]"
                  checked={Boolean((form as any)[t.key])}
                  onChange={(e) => update(t.key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
