'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { dictionaries, Locale, Dictionary } from './dictionaries'

type I18nContextType = {
    locale: Locale
    t: Dictionary
    setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children, initialLocale = 'es' }: { children: ReactNode, initialLocale?: Locale }) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale)
    const [t, setT] = useState<Dictionary>(dictionaries[initialLocale])

    useEffect(() => {
        setT(dictionaries[locale])
        // Persist preference
        if (typeof window !== 'undefined') {
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
        }
    }, [locale])

    return (
        <I18nContext.Provider value={{ locale, t, setLocale: setLocaleState }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}