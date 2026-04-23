export async function withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    try {
        return await operation()
    } catch (error) {
        if (retries <= 0) throw error

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        return withRetry(operation, retries - 1, delay * 2)
    }
}

export function optimizeTokens(text: string): string {
    if (!text) return ""
    // Eliminar espacios múltiples, saltos de línea excesivos y caracteres invisibles
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
}
