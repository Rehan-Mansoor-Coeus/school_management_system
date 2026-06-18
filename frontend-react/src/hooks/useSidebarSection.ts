import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function useSidebarSection(defaultOpen = false, matchPaths: string[] = []) {
  const location = useLocation()
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (matchPaths.some(path => location.pathname.startsWith(path))) {
      setOpen(true)
    }
  }, [location.pathname, matchPaths.join('|')])

  return [open, setOpen] as const
}
