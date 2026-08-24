import { NavLink } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'

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
  | 'navy'
  | 'gold'

export type ColoredTabItem = {
  label: string
  path: string
  end?: boolean
  icon?: ComponentType<{ className?: string }>
  color?: TabColor
  badge?: number
}

/** Accent colors for inactive outlined tabs. */
const inactiveStyles: Record<TabColor, string> = {
  navy: 'border-[#1e3a5f] bg-white text-[#1e3a5f] hover:bg-slate-50',
  gold: 'border-[#A67C00] bg-white text-[#A67C00] hover:bg-amber-50',
  blue: 'border-blue-500 bg-white text-blue-700 hover:bg-blue-50',
  indigo: 'border-indigo-500 bg-white text-indigo-700 hover:bg-indigo-50',
  violet: 'border-violet-500 bg-white text-violet-700 hover:bg-violet-50',
  purple: 'border-[#6F42C1] bg-white text-[#6F42C1] hover:bg-purple-50',
  pink: 'border-pink-500 bg-white text-pink-700 hover:bg-pink-50',
  rose: 'border-rose-500 bg-white text-rose-700 hover:bg-rose-50',
  orange: 'border-orange-500 bg-white text-orange-700 hover:bg-orange-50',
  amber: 'border-[#A67C00] bg-white text-[#A67C00] hover:bg-amber-50',
  emerald: 'border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50',
  teal: 'border-teal-500 bg-white text-teal-700 hover:bg-teal-50',
  cyan: 'border-cyan-500 bg-white text-cyan-700 hover:bg-cyan-50',
  slate: 'border-slate-400 bg-white text-slate-700 hover:bg-slate-50',
}

const PAGE_ACTIVE = 'border-transparent bg-[#1e3a5f] text-white shadow-sm'

const pillActiveStyles: Record<TabColor, string> = {
  navy: 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-sm',
  gold: 'border-[#eab308] bg-[#eab308] text-[#1e3a5f] shadow-sm',
  blue: 'border-sky-500 bg-sky-500 text-white shadow-sm',
  indigo: 'border-indigo-500 bg-indigo-500 text-white shadow-sm',
  violet: 'border-violet-500 bg-violet-500 text-white shadow-sm',
  purple: 'border-[#6F42C1] bg-[#6F42C1] text-white shadow-sm',
  pink: 'border-pink-500 bg-pink-500 text-white shadow-sm',
  rose: 'border-rose-500 bg-rose-500 text-white shadow-sm',
  orange: 'border-orange-500 bg-orange-500 text-slate-900 shadow-sm',
  amber: 'border-[#eab308] bg-[#eab308] text-[#1e3a5f] shadow-sm',
  emerald: 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
  teal: 'border-teal-500 bg-teal-500 text-white shadow-sm',
  cyan: 'border-cyan-500 bg-cyan-500 text-white shadow-sm',
  slate: 'border-slate-600 bg-slate-700 text-white shadow-sm',
}

const COLOR_CYCLE: TabColor[] = [
  'emerald',
  'amber',
  'purple',
  'blue',
  'indigo',
  'teal',
  'rose',
  'orange',
  'cyan',
  'violet',
  'pink',
  'gold',
]

export function tabColorAt(index: number): TabColor {
  return COLOR_CYCLE[index % COLOR_CYCLE.length]
}

export function coloredTabClass(
  color: TabColor | undefined,
  isActive: boolean,
  variant: 'pages' | 'pills' = 'pages'
): string {
  const tone = color || 'slate'
  const active = variant === 'pills' ? pillActiveStyles[tone] : PAGE_ACTIVE
  return [
    'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
    isActive ? active : inactiveStyles[tone],
  ].join(' ')
}

export function ColoredTabsBar({
  items,
  activeId,
  onChange,
}: {
  items: Array<{ id: string; label: string; color?: TabColor; icon?: ComponentType<{ className?: string }>; badge?: number }>
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const color = item.color || tabColorAt(index)
        const Icon = item.icon
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={coloredTabClass(color, isActive, 'pills')}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span>{item.label}</span>
            {typeof item.badge === 'number' ? (
              <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${isActive ? 'bg-white/80 text-slate-800' : 'bg-slate-100 text-slate-700'}`}>
                {item.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

export default function ColoredModuleTabsNav({ items }: { items: ColoredTabItem[] }) {
  if (!items.length) return null

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {items.map((item, index) => {
        const color = item.color || tabColorAt(index)
        const Icon = item.icon

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => coloredTabClass(color, isActive)}
          >
            {({ isActive }) => (
              <>
                {Icon ? <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-95' : 'opacity-90'}`} /> : null}
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
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

/** Optional helper when a page needs a non-nav decorative label. */
export function ColoredTabLabel({
  color,
  active,
  children,
}: {
  color?: TabColor
  active?: boolean
  children: ReactNode
}) {
  return <span className={coloredTabClass(color, !!active)}>{children}</span>
}
