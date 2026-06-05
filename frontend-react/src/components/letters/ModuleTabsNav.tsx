import { NavLink } from 'react-router-dom'
import { countBadgeTone, type ModuleTabItem } from './lettersMenuConfig'

type Counts = Record<string, number>

function countBadgeClass(tone: 'teal' | 'pink' | 'purple', active: boolean) {
  if (active) return 'rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white'
  const tones = {
    teal: 'rounded-full bg-teal-100 px-1.5 py-0.5 text-xs font-bold text-teal-700',
    pink: 'rounded-full bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700',
    purple: 'rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700',
  }
  return tones[tone]
}

export default function ModuleTabsNav({
  items,
  counts = {},
  t,
}: {
  items: ModuleTabItem[]
  counts?: Counts
  t: (key: string) => string
}) {
  if (!items.length) return null

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {items.map((item) => {
        const count = item.countKey ? counts[item.countKey] : undefined

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {t(item.labelKey)}
                {typeof count === 'number' && count > 0 ? (
                  <span className={countBadgeClass(countBadgeTone(item.countKey), isActive)}>{count}</span>
                ) : null}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
