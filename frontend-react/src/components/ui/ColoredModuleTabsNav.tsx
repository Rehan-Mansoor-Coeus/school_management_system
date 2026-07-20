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

/** Accent colors for inactive outlined tabs (active is always navy). */
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

const ACTIVE_STYLE = 'border-transparent bg-[#1e3a5f] text-white shadow-sm'

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

export function coloredTabClass(color: TabColor | undefined, isActive: boolean): string {
  const tone = color || 'slate'
  return [
    'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all',
    isActive ? ACTIVE_STYLE : inactiveStyles[tone],
  ].join(' ')
}

export function ColoredTabsBar({
  items,
  activeId,
  onChange,
}: {
  items: Array<{ id: string; label: string; color?: TabColor; icon?: ComponentType<{ className?: string }> }>
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {items.map((item, index) => {
        const color = item.color || tabColorAt(index)
        const Icon = item.icon
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={coloredTabClass(color, isActive)}
          >
            {Icon ? <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-95' : 'opacity-90'}`} /> : null}
            <span>{item.label}</span>
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
