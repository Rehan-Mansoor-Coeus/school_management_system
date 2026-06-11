import { ChevronDown } from 'lucide-react'

export type FormSelectOption = {
  value: string
  label: string
}

type FormSelectProps = {
  value: string
  onChange: (value: string) => void
  options: FormSelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required,
  disabled,
  className = '',
}: FormSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}
