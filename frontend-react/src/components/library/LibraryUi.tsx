import type { ComponentType, ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string
  subtitle?: string
  icon?: ComponentType<{ className?: string }>
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: ReactNode
  icon?: ComponentType<{ className?: string }>
  tone?: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate'
}) {
  const tones: Record<string, string> = {
    blue: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon ? (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}

const badgeTones: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-sky-100 text-sky-700',
  reserved: 'bg-sky-100 text-sky-700',
  pending: 'bg-amber-100 text-amber-700',
  requested: 'bg-amber-100 text-amber-700',
  issued: 'bg-violet-100 text-violet-700',
  borrowed: 'bg-violet-100 text-violet-700',
  returned: 'bg-slate-100 text-slate-600',
  overdue: 'bg-rose-100 text-rose-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
  lost: 'bg-rose-100 text-rose-700',
  damaged: 'bg-orange-100 text-orange-700',
  unpaid: 'bg-rose-100 text-rose-700',
  paid: 'bg-emerald-100 text-emerald-700',
  waived: 'bg-slate-100 text-slate-600',
  inactive: 'bg-slate-100 text-slate-500',
}

export function StatusBadge({ status }: { status?: string | null }) {
  const key = (status || '').toLowerCase()
  const tone = badgeTones[key] || 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>{status || '—'}</span>
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: 'bg-[#1e3a5f] text-white hover:bg-[#27496d] disabled:opacity-50',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]'

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">{message}</div>
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1e3a5f]" />
    </div>
  )
}

export function Stars({ value }: { value?: number | null }) {
  if (value === null || value === undefined) return <span className="text-xs text-slate-400">No ratings</span>
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" title={`${value} / 5`}>
      {'★'.repeat(Math.round(value))}
      <span className="text-slate-300">{'★'.repeat(5 - Math.round(value))}</span>
      <span className="ml-1 text-xs text-slate-500">{value.toFixed(1)}</span>
    </span>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
    </div>
  )
}

export const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'
export const tdClass = 'whitespace-nowrap px-4 py-3 text-slate-700'
