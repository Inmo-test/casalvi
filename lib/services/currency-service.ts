/**
 * Currency Service
 * Handles fetching exchange rates and converting amounts.
 * Uses localStorage cache to avoid spamming APIs.
 * Fallback to static rates if API fails.
 */

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CNY'

export interface ExchangeRates {
    base: string
    date: string
    rates: Record<string, number>
}

// Fallback rates (Base EUR) - Updated approx 2024
const STATIC_RATES: Record<string, number> = {
    EUR: 1,
    USD: 1.09,
    GBP: 0.85,
    CNY: 7.85
}

const CACHE_KEY = 'casalvi_exchange_rates'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function getExchangeRates(base: string = 'EUR'): Promise<Record<string, number>> {
    // 1. Try Cache
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            try {
                const parsed = JSON.parse(cached)
                const age = Date.now() - parsed.timestamp
                if (age < CACHE_DURATION) {
                    console.log("💰 Using cached exchange rates")
                    return parsed.rates
                }
            } catch (e) {
                console.warn('Invalid currency cache')
            }
        }
    }

    // 2. Fetch API (Using frankfurter.app - Free, open source, no key)
    try {
        console.log("🌍 Fetching fresh exchange rates...")
        const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`)
        if (!res.ok) throw new Error('Failed to fetch rates')
        const data = await res.json()

        // Normalize data (add base currency itself)
        const rates = { ...data.rates, [base]: 1 }

        // Update Cache
        if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                rates
            }))
        }

        return rates
    } catch (error) {
        console.warn("⚠️ Currency API failed, using static fallback.", error)
        return STATIC_RATES
    }
}

export function formatCurrency(amount: number, currency: Currency, locale: string = 'es-ES'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount)
}
