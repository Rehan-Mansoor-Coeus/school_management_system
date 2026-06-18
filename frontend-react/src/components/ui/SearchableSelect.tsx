import { useEffect, useMemo, useRef, useState } from 'react'

export type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  emptyLabel?: string
  className?: string
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search or select...',
  emptyLabel = 'No matches found',
  className = '',
}: SearchableSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find(option => option.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(option => option.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label || '')
    }
  }, [open, selected])

  function choose(nextValue: string) {
    onChange(nextValue)
    const next = options.find(option => option.value === nextValue)
    setQuery(next?.label || '')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        value={open ? query : (selected?.label || query)}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true)
          setQuery(selected?.label || query)
        }}
        onChange={event => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
      />
      {open && (
        <div className="absolute z-[100] mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filtered.map(option => (
            <button
              key={option.value}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${option.value === value ? 'bg-sky-50 font-semibold text-[#1e3a5f]' : 'text-slate-700'}`}
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(option.value)}
            >
              {option.label}
            </button>
          ))}
          {!filtered.length && (
            <div className="px-3 py-2 text-sm text-slate-500">{emptyLabel}</div>
          )}
        </div>
      )}
    </div>
  )
}
