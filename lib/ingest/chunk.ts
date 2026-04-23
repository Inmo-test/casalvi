/**
 * Trocea texto largo en chunks de ~1000 caracteres con solape, respetando
 * separadores naturales (párrafos, frases).
 */
export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {}
): string[] {
  const size = opts.size ?? 1000
  const overlap = opts.overlap ?? 150
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= size) return clean ? [clean] : []

  const chunks: string[] = []
  let i = 0
  while (i < clean.length) {
    const end = Math.min(i + size, clean.length)
    let boundary = end
    if (end < clean.length) {
      const lastPeriod = clean.lastIndexOf('.', end)
      const lastSpace = clean.lastIndexOf(' ', end)
      boundary = Math.max(lastPeriod, lastSpace, i + size / 2)
    }
    chunks.push(clean.slice(i, boundary).trim())
    i = boundary - overlap
    if (i <= 0) i = boundary
  }
  return chunks.filter(Boolean)
}
