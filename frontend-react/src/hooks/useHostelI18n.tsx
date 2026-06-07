import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type HostelLocale } from '../i18n/hostel'

export function useHostelI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as HostelLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as HostelLocale),
    }),
    [locale, setAppLocale],
  )
}
