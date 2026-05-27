import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getLocale, setLocale, t, type Locale } from '../i18n/timesheets'

type I18nContextValue = {
  locale: Locale
  setAppLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setAppLocale: () => {},
  t: (key) => key,
})

export function TimesheetI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale())

  const value = useMemo(
    () => ({
      locale,
      setAppLocale: (next: Locale) => {
        setLocale(next)
        setLocaleState(next)
      },
      t: (key: string) => t(key, locale),
    }),
    [locale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTimesheetI18n() {
  return useContext(I18nContext)
}
