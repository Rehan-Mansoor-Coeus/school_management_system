import { NavLink } from 'react-router-dom'
import type { ComponentType } from 'react'

export type TabColor =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'slate'

export type ColoredTabItem = {
  label: string
  path: string
  end?: boolean
  icon?: ComponentType<{ className?: string }>
  color?: TabColor
  badge?: number
}

const inactiveStyles: Record<TabColor, string> = {
  blue: 'border-blue-100 bg-blue-50/80 text-blue-800 hover:bg-blue-100',
  indigo: 'border-indigo-100 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100',
  violet: 'border-violet-100 bg-violet-50/80 text-violet-800 hover:bg-violet-100',
  purple: 'border-purple-100 bg-purple-50/80 text-purple-800 hover:bg-purple-100',
  pink: 'border-pink-100 bg-pink-50/80 text-pink-800 hover:bg-pink-100',
  rose: 'border-rose-100 bg-rose-50/80 text-rose-800 hover:bg-rose-100',
  orange: 'border-orange-100 bg-orange-50/80 text-orange-800 hover:bg-orange-100',
  amber: 'border-amber-100 bg-amber-50/80 text-amber-800 hover:bg-amber-100',
  emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100',
  teal: 'border-teal-100 bg-teal-50/80 text-teal-800 hover:bg-teal-100',
  cyan: 'border-cyan-100 bg-cyan-50/80 text-cyan-800 hover:bg-cyan-100',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
}

const activeStyles: Record<TabColor, string> = {
  blue: 'bg-blue-600 text-white shadow-md shadow-blue-200',
  indigo: 'bg-indigo-600 text-white shadow-md shadow-indigo-200',
  violet: 'bg-violet-600 text-white shadow-md shadow-violet-200',
  purple: 'bg-purple-600 text-white shadow-md shadow-purple-200',
  pink: 'bg-pink-600 text-white shadow-md shadow-pink-200',
  rose: 'bg-rose-600 text-white shadow-md shadow-rose-200',
  orange: 'bg-orange-600 text-white shadow-md shadow-orange-200',
  amber: 'bg-amber-600 text-white shadow-md shadow-amber-200',
  emerald: 'bg-emerald-600 text-white shadow-md shadow-emerald-200',
  teal: 'bg-teal-600 text-white shadow-md shadow-teal-200',
  cyan: 'bg-cyan-600 text-white shadow-md shadow-cyan-200',
  slate: 'bg-[#1e3a5f] text-white shadow-md shadow-slate-300',
}

export default function ColoredModuleTabsNav({ items }: { items: ColoredTabItem[] }) {
  if (!items.length) return null

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {items.map((item) => {
        const color = item.color || 'slate'
        const Icon = item.icon

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                isActive ? activeStyles[color] : inactiveStyles[color]
              }`
            }
          >
            {({ isActive }) => (
              <>
                {Icon ? <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-95' : 'opacity-80'}`} /> : null}
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-white/70 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
