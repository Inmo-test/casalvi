'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { sendGAEvent } from '@next/third-parties/google'

function AnalyticsListenerContent() {
    const searchParams = useSearchParams()
    const pathname = usePathname()

    useEffect(() => {
        // 1. Detect Signup Success
        // We look for ?signup=success which we will add to the redirect in auth actions
        if (searchParams.get('signup') === 'success') {
            sendGAEvent('event', 'sign_up', {
                method: 'web_form'
            })
        }

        // 2. Detect Purchase Success from Stripe
        // URL: /dashboard?checkout=success
        if (searchParams.get('checkout') === 'success') {
            sendGAEvent('event', 'purchase', {
                transaction_id: crypto.randomUUID(), // In a real app, this should come from Stripe/Backend
                currency: 'EUR',
                // value: 49.00 // We could pass this via URL or deduce from plan metadata if available
            })
        }
    }, [searchParams, pathname])

    return null
}

export function AnalyticsListener() {
    return (
        <Suspense fallback={null}>
            <AnalyticsListenerContent />
        </Suspense>
    )
}
