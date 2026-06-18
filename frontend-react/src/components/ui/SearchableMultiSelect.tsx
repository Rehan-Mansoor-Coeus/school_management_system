import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export type SearchableMultiSelectOption = {
  id: string | number
  label: string
  sublabel?: string
}

type Props = {
  options: SearchableMultiSelectOption[]
  selected: SearchableMultiSelectOption[]
  onChange: (selected: SearchableMultiSelectOption[]) => void
  onSelect?: (option: SearchableMultiSelectOption) => void
  placeholder?: string
  emptyLabel?: string
  className?: string
}

export default function SearchableMultiSelect({
  options,
  selected,
  onChange,
  onSelect,
  placeholder = 'Search...',
  emptyLabel = 'No matches found',
  className = '',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedIds = useMemo(() => new Set(selected.map((item) => String(item.id))), [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return options.filter((option) => {
      if (selectedIds.has(String(option.id))) return false
      if (!q) return true
      const haystack = `${option.label} ${option.sublabel || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [options, query, selectedIds])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function add(option: SearchableMultiSelectOption) {
    if (selectedIds.has(String(option.id))) return
    onChange([...selected, option])
    onSelect?.(option)
    setQuery('')
    setOpen(true)
  }

  function remove(id: string | number) {
    onChange(selected.filter((item) => String(item.id) !== String(id)))
  }

  return (
    <div ref={rootRef} className={`space-y-2 ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
        />
        {open && (
          <div className="absolute z-[100] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(option)}
              >
                <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                {option.sublabel && <div className="text-xs text-slate-500">{option.sublabel}</div>}
              </button>
            ))}
            {!filtered.length && (
              <div className="px-3 py-2 text-sm text-slate-500">{emptyLabel}</div>
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full border border-[#1e3a5f] bg-white px-2.5 py-1 text-xs font-medium text-[#1e3a5f]"
            >
              {item.label}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-full p-0.5 hover:bg-slate-100"
                aria-label={`Remove ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
