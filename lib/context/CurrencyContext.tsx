'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Currency } from '../services/currency-service'

interface CurrencyContextType {
    currency: Currency
    setCurrency: (currency: Currency) => void
    formatPrice: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>('EUR')
    const [rates, setRates] = useState<Record<string, number>>({ EUR: 1, USD: 1.09, GBP: 0.85, CNY: 7.85 })

    // Load preference and rates on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('casalvi_currency_preference') as Currency
            if (saved) setCurrencyState(saved)

            // Fetch fresh rates
            import('../services/currency-service').then(({ getExchangeRates }) => {
                getExchangeRates().then(setRates)
            })
        }
    }, [])

    const setCurrency = (c: Currency) => {
        setCurrencyState(c)
        if (typeof window !== 'undefined') {
            localStorage.setItem('casalvi_currency_preference', c)
        }
    }

    const formatPrice = (amountInEur: number) => {
        const rate = rates[currency] || 1
        const converted = amountInEur * rate

        return new Intl.NumberFormat(typeof navigator !== 'undefined' ? navigator.language : 'es-ES', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(converted)
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (!context) throw new Error('useCurrency must be used within CurrencyProvider')
    return context
}