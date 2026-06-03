import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type Locale } from '../i18n/admissions'

export function useAdmissionsI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as Locale,
      setAppLocale,
      t: (key: string) => translate(key, locale as Locale),
    }),
    [locale, setAppLocale],
  )
}
