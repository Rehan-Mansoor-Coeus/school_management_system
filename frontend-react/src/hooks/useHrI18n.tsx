import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type HrLocale } from '../i18n/hr'

export function useHrI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as HrLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as HrLocale),
    }),
    [locale, setAppLocale],
  )
}
