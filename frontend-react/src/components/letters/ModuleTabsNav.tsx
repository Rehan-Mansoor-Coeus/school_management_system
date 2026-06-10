import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'
import { type ModuleTabItem } from './lettersMenuConfig'

type Counts = Record<string, number>

export default function ModuleTabsNav({
  items,
  counts = {},
  t,
}: {
  items: ModuleTabItem[]
  counts?: Counts
  t: (key: string) => string
}) {
  const tabs = items.map((item) => ({
    label: t(item.labelKey),
    path: item.path,
    end: item.end,
    icon: item.icon,
    color: item.color,
    badge: item.countKey ? counts[item.countKey] : undefined,
  }))

  return <ColoredModuleTabsNav items={tabs} />
}
