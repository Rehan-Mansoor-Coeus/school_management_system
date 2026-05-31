import { useEffect, useState } from 'react'
import { searchPeopleRecipients } from '../../api/people'
import { searchLetterRecipients } from '../../api/letters'
import { FieldLabel, TextInput } from './LettersUi'

export type RecipientOption = {
  id?: number
  name: string
  email?: string
  phone?: string
  address?: string
  recipient_type?: string
  recipient_id?: number
}

type Props = {
  label: string
  required?: boolean
  multiple?: boolean
  value: RecipientOption[]
  onChange: (value: RecipientOption[]) => void
  source?: 'users' | 'customers' | 'billers' | 'suppliers' | 'all' | 'custom'
  usePeopleSearch?: boolean
  showCustomPhone?: boolean
}

export default function RecipientSelect({
  label,
  required,
  multiple = true,
  value,
  onChange,
  source = 'all',
  usePeopleSearch = false,
  showCustomPhone = true,
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RecipientOption[]>([])
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (source === 'custom') {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      const request = usePeopleSearch
        ? searchPeopleRecipients(query.trim(), source)
        : searchLetterRecipients(query.trim())
      request
        .then(res => setResults(res.data || []))
        .catch(() => setResults([]))
    }, query.trim().length === 0 ? 0 : 250)
    return () => clearTimeout(timer)
  }, [query, source, usePeopleSearch])

  function addRecipient(item: RecipientOption) {
    const exists = item.recipient_id
      ? value.some(v => v.recipient_id === item.recipient_id && v.recipient_type === item.recipient_type)
      : value.some(v => v.name === item.name && v.phone === item.phone)
    if (exists) return
    onChange(multiple ? [...value, item] : [item])
    setQuery('')
    setShowDropdown(false)
  }

  function addCustom() {
    if (!customName.trim()) return
    addRecipient({
      name: customName.trim(),
      email: customEmail || undefined,
      phone: customPhone || undefined,
      recipient_type: 'custom',
    })
    setCustomName('')
    setCustomEmail('')
    setCustomPhone('')
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  const missingPhone = value.filter(item => !item.phone?.trim())

  return (
    <div className="space-y-3">
      <FieldLabel required={required}>{label}</FieldLabel>
      {source !== 'custom' && (
        <>
          <TextInput
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name, email, or phone..."
          />
          {showDropdown && results.length > 0 && (
            <div className="max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              {results.map(item => (
                <button
                  key={`${item.id || item.name}-${item.email}-${item.type || item.recipient_type}`}
                  type="button"
                  onClick={() => addRecipient({
                    name: item.name,
                    email: item.email,
                    phone: item.phone,
                    address: item.address,
                    recipient_type: (item as any).type || item.recipient_type || 'user',
                    recipient_id: item.id,
                  })}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {[item.email, item.phone].filter(Boolean).join(' · ') || '—'} · {(item as any).role || (item as any).type || 'user'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={`${item.name}-${index}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${item.phone ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' : 'bg-amber-100 text-amber-800'}`}>
              <span>{item.name}{item.phone ? ` (${item.phone})` : ' (no phone)'}</span>
              <button type="button" onClick={() => removeAt(index)} className="text-red-500">×</button>
            </span>
          ))}
        </div>
      )}

      {missingPhone.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {missingPhone.length} selected recipient(s) have no phone number. WhatsApp delivery requires a phone number.
        </div>
      )}

      {showCustomPhone && (
        <div className="rounded-xl border border-dashed border-slate-300 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Custom recipient / phone number</div>
          <div className="grid gap-2 md:grid-cols-3">
            <TextInput value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Name" />
            <TextInput value={customEmail} onChange={e => setCustomEmail(e.target.value)} placeholder="Email" />
            <TextInput value={customPhone} onChange={e => setCustomPhone(e.target.value)} placeholder="Phone *" />
          </div>
          <button type="button" onClick={addCustom} className="mt-2 text-sm font-semibold text-[#1e3a5f]">+ Add custom recipient</button>
        </div>
      )}
    </div>
  )
}
