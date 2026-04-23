/**
 * Standardized Server Action Response Types
 * 
 * Usage:
 * - Return createSuccess(data) for successful operations
 * - Return createError(message, code) for failures
 * - Use ServerActionResult<T> as return type
 */

export type ServerActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string; details?: unknown }

export type ServerActionError = Extract<ServerActionResult, { success: false }>
export type ServerActionSuccess<T> = Extract<ServerActionResult<T>, { success: true }>

/**
 * Create a standardized error response
 * 
 * @param message - Human-readable error message
 * @param code - Optional error code for programmatic handling (e.g. 'AUTH_REQUIRED', 'LIMIT_REACHED')
 * @param details - Optional additional error details (e.g. validation errors)
 * 
 * @example
 * return createError('No autenticado', 'AUTH_REQUIRED')
 * return createError('Datos inválidos', 'VALIDATION_ERROR', { field: 'email' })
 */
export function createError(
    message: string,
    code?: string,
    details?: unknown
): ServerActionError {
    return { success: false, error: message, code, details }
}

/**
 * Create a standardized success response
 * 
 * @param data - The data to return
 * 
 * @example
 * return createSuccess({ contactId: newContact.id })
 * return createSuccess(undefined) // For void operations
 */
export function createSuccess<T>(data: T): ServerActionSuccess<T> {
    return { success: true, data }
}

/**
 * Common error codes for consistent handling across the application
 */
export const ErrorCode = {
    // Authentication & Authorization
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',

    // Resource Limits
    LIMIT_REACHED: 'LIMIT_REACHED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED', // NUEVO: Para rate limiting temporal
    UPGRADE_REQUIRED: 'UPGRADE_REQUIRED',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resources
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // Database
    DB_ERROR: 'DB_ERROR',

    // Generic
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]
