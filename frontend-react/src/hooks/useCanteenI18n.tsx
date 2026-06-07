import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type CanteenLocale } from '../i18n/canteen'

export function useCanteenI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as CanteenLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as CanteenLocale),
    }),
    [locale, setAppLocale],
  )
}
