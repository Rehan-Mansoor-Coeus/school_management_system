import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, hint, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export const formInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15'
