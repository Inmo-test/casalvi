/**
 * Platform Abstraction Layer
 * 
 * Provides platform-agnostic utilities for cross-platform compatibility.
 * This allows the same codebase to work in Web, React Native, and Capacitor.
 */

// Platform Detection
export const isWeb = typeof window !== 'undefined'
export const isMobile = false // Will be true in React Native/Capacitor builds
export const isServer = typeof window === 'undefined'

/**
 * Platform-agnostic page refresh
 * 
 * - Web: Reloads the current page
 * - Mobile: Should trigger navigation reset or state refresh
 */
export const platformRefresh = (): void => {
    if (isWeb) {
        window.location.reload()
    }
    // In React Native/Capacitor:
    // - Option 1: navigation.reset() to root
    // - Option 2: Trigger global state refresh
    // - Option 3: Emit refresh event
}

/**
 * Safe window accessor
 * Returns window object only if available, otherwise undefined
 */
export const getWindow = (): Window | undefined => {
    return isWeb ? window : undefined
}

/**
 * Safe document accessor
 * Returns document object only if available, otherwise undefined
 */
export const getDocument = (): Document | undefined => {
    return isWeb ? document : undefined
}
