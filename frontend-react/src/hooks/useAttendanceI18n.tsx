import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type AttendanceLocale } from '../i18n/attendance'

export function useAttendanceI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as AttendanceLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as AttendanceLocale),
    }),
    [locale, setAppLocale],
  )
}
