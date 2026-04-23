import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Inicializar Redis (solo si las env vars están configuradas)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limiters por tipo de operación
export const rateLimiters = {
  // Creación de contactos: 100/hora por agencia
  contacts: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    analytics: true,
    prefix: "ratelimit:contacts",
  }) : null,

  // Creación de propiedades: 50/hora por agencia
  properties: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    analytics: true,
    prefix: "ratelimit:properties",
  }) : null,

  // Uso de IA: 50 requests/día por agencia (más estricto)
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "24 h"),
    analytics: true,
    prefix: "ratelimit:ai",
  }) : null,

  // Importación CSV: 5/día por agencia (muy costoso)
  csv_import: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "24 h"),
    analytics: true,
    prefix: "ratelimit:csv",
  }) : null,
}

export async function checkRateLimit(
  agencyId: string,
  operation: keyof typeof rateLimiters
): Promise<{ allowed: boolean; message?: string; limit?: number; remaining?: number }> {
  const limiter = rateLimiters[operation]

  // Si Redis no está configurado, permitir (fail-open para dev)
  if (!limiter) {
    console.warn('[Rate Limit] Redis not configured, skipping rate limit check')
    return { allowed: true }
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(agencyId)

    if (!success) {
      return {
        allowed: false,
        message: `Límite de uso excedido. Puedes volver a intentarlo en ${Math.ceil((reset - Date.now()) / 60000)} minutos.`,
        limit,
        remaining: 0
      }
    }

    return { allowed: true, limit, remaining }
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error)
    // Fail-open: Si hay error de Redis, no bloquear al usuario
    return { allowed: true }
  }
}
