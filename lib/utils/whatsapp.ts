/**
 * Genera una URL de WhatsApp para un número de teléfono
 * 
 * @param phone - Número de teléfono (puede tener espacios, guiones, paréntesis, etc.)
 * @returns URL de WhatsApp o null si el teléfono no es válido
 */
export function getWhatsAppUrl(phone: string | null | undefined): string | null {
  // Si no hay teléfono, devolver null
  if (!phone) {
    return null
  }

  // Limpiar el string: eliminar espacios, guiones, paréntesis y el símbolo +
  let cleaned = phone.trim()
    .replace(/\s+/g, '') // Eliminar espacios
    .replace(/-/g, '') // Eliminar guiones
    .replace(/\(/g, '') // Eliminar paréntesis abiertos
    .replace(/\)/g, '') // Eliminar paréntesis cerrados
    .replace(/\+/g, '') // Eliminar el símbolo +
    .replace(/\./g, '') // Eliminar puntos (por si acaso)

  // Si el número está vacío después de limpiar, devolver null
  if (cleaned.length === 0) {
    return null
  }

  // Si el número no tiene prefijo de país y parece ser español
  // (empieza por 6 o 7 y tiene 9 dígitos), añadir prefijo 34
  if (cleaned.length === 9 && /^[67]/.test(cleaned)) {
    cleaned = `34${cleaned}`
  }

  // Validar que el número solo contenga dígitos
  if (!/^\d+$/.test(cleaned)) {
    return null
  }

  // Devolver la URL de WhatsApp
  return `https://wa.me/${cleaned}`
}


