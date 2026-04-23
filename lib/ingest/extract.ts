/**
 * Extracción de texto a partir de archivos locales.
 * Soporta PDF, DOCX, imágenes (vía OCR Tesseract o Vision API) y texto plano.
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface ExtractedFile {
  text: string
  mimeType: string
}

export async function extractText(filePath: string): Promise<ExtractedFile> {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.pdf') {
    return { text: await extractPdf(filePath), mimeType: 'application/pdf' }
  }
  if (ext === '.docx') {
    return { text: await extractDocx(filePath), mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  }
  if (['.txt', '.md', '.csv'].includes(ext)) {
    return { text: await fs.readFile(filePath, 'utf8'), mimeType: 'text/plain' }
  }
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    return { text: await extractImageOCR(filePath), mimeType: `image/${ext.slice(1)}` }
  }

  throw new Error(`Formato no soportado: ${ext}`)
}

async function extractPdf(filePath: string): Promise<string> {
  const pdfParse = (await import('pdf-parse' as any)).default
  const buffer = await fs.readFile(filePath)
  const data = await pdfParse(buffer)
  return data.text || ''
}

async function extractDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import('mammoth' as any)
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value || ''
  } catch (err) {
    throw new Error(`Instala "mammoth" para procesar DOCX: ${(err as Error).message}`)
  }
}

async function extractImageOCR(filePath: string): Promise<string> {
  // Stub — la extracción por OCR de imágenes requiere Tesseract o Vision API.
  // Para modo OpenAI usamos gpt-4o-mini vision (a implementar). Modo local
  // requiere instalar tesseract.js o un servicio externo.
  return `[OCR pendiente: ${path.basename(filePath)}]`
}
