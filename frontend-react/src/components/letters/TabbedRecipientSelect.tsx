import { useEffect, useState } from 'react'
import { Search, UserPlus, Users } from 'lucide-react'
import { searchLetterRecipients } from '../../api/letters'
import { FieldLabel, PrimaryButton, TextInput } from './LettersUi'

export type RecipientOption = {
  id?: number
  name: string
  email?: string
  phone?: string
  address?: string
  recipient_type?: string
  recipient_id?: number
}

const RECIPIENT_TABS = [
  { value: 'users', label: 'Users', selectAllLabel: 'All Users' },
  { value: 'students', label: 'Students', selectAllLabel: 'All Students' },
  { value: 'staff', label: 'Staff', selectAllLabel: 'All Staff' },
  { value: 'suppliers', label: 'Suppliers', selectAllLabel: 'All Suppliers' },
  { value: 'custom', label: 'Custom Phone', selectAllLabel: '' },
]

type Props = {
  label: string
  required?: boolean
  value: RecipientOption[]
  onChange: (value: RecipientOption[]) => void
}

function mapRow(item: any): RecipientOption {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    address: item.address,
    recipient_type: item.recipient_type || item.type || 'user',
    recipient_id: item.id,
  }
}

export default function TabbedRecipientSelect({ label, required, value, onChange }: Props) {
  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RecipientOption[]>([])
  const [selectingAll, setSelectingAll] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customAddress, setCustomAddress] = useState('')

  const activeTab = RECIPIENT_TABS.find(item => item.value === tab)

  useEffect(() => {
    if (tab === 'custom') {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      searchLetterRecipients(query.trim(), tab)
        .then(res => setResults((res.data || []).map(mapRow)))
        .catch(() => setResults([]))
    }, query.trim() ? 250 : 0)
    return () => clearTimeout(timer)
  }, [tab, query])

  function addRecipient(row: RecipientOption) {
    const exists = row.recipient_id
      ? value.some(item => item.recipient_id === row.recipient_id && item.recipient_type === row.recipient_type)
      : value.some(item => item.name === row.name && item.phone === row.phone)
    if (exists) return
    onChange([...value, row])
    setQuery('')
  }

  async function selectAllInTab() {
    if (!activeTab?.selectAllLabel) return
    setSelectingAll(true)
    try {
      const res = await searchLetterRecipients('', tab, true)
      const rows = (res.data || []).map(mapRow)
      const merged = [...value]
      rows.forEach(row => {
        const exists = row.recipient_id
          ? merged.some(item => item.recipient_id === row.recipient_id && item.recipient_type === row.recipient_type)
          : merged.some(item => item.name === row.name && item.phone === row.phone)
        if (!exists) merged.push(row)
      })
      onChange(merged)
    } finally {
      setSelectingAll(false)
    }
  }

  function addCustom() {
    if (!customName.trim() || !customPhone.trim()) return
    addRecipient({
      name: customName.trim(),
      email: customEmail || undefined,
      phone: customPhone.trim(),
      address: customAddress || undefined,
      recipient_type: 'custom',
    })
    setCustomName('')
    setCustomEmail('')
    setCustomPhone('')
    setCustomAddress('')
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <FieldLabel required={required}>{label}</FieldLabel>

      <div className="flex flex-wrap gap-2">
        {RECIPIENT_TABS.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === item.value ? 'bg-[#1e3a5f] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab !== 'custom' ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="pl-9"
              />
            </div>
            {activeTab?.selectAllLabel && (
              <button
                type="button"
                disabled={selectingAll}
                onClick={selectAllInTab}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50 disabled:opacity-50"
              >
                <Users className="h-3.5 w-3.5" />
                {selectingAll ? 'Loading...' : activeTab.selectAllLabel}
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white">
            {results.map((item, index) => (
              <button
                key={`${item.recipient_type}-${item.recipient_id || item.name}-${index}`}
                type="button"
                onClick={() => addRecipient(item)}
                className="flex w-full items-start justify-between border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {[item.email, item.phone].filter(Boolean).join(' · ') || 'No contact info'}
                  </div>
                </div>
                <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-[#1e3a5f]" />
              </button>
            ))}
            {!results.length && <div className="px-3 py-6 text-center text-xs text-slate-500">No matches found.</div>}
          </div>
        </>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          <TextInput value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Name *" />
          <TextInput value={customPhone} onChange={e => setCustomPhone(e.target.value)} placeholder="Phone *" />
          <TextInput value={customEmail} onChange={e => setCustomEmail(e.target.value)} placeholder="Email" />
          <TextInput value={customAddress} onChange={e => setCustomAddress(e.target.value)} placeholder="Address" />
          <div className="md:col-span-2">
            <PrimaryButton type="button" onClick={addCustom}>+ Add custom recipient</PrimaryButton>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={`${item.name}-${index}`}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${item.phone ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' : 'bg-amber-100 text-amber-800'}`}
            >
              <span>{item.name}{item.phone ? ` (${item.phone})` : ' (no phone)'}</span>
              <button type="button" onClick={() => removeAt(index)} className="text-red-500">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
