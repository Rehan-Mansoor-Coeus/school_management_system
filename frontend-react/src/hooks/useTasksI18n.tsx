import { useMemo } from 'react'
import { useTimesheetI18n } from './useTimesheetI18n'
import { t as translate, type TasksLocale } from '../i18n/tasks'

export function useTasksI18n() {
  const { locale, setAppLocale } = useTimesheetI18n()

  return useMemo(
    () => ({
      locale: locale as TasksLocale,
      setAppLocale,
      t: (key: string) => translate(key, locale as TasksLocale),
    }),
    [locale, setAppLocale],
  )
}
