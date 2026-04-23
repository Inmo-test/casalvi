// Force deploy: Fix pdf-parse patch
/**
 * Servicio de extracción de texto (OCR)
 * Soporta solo PDF (nativo). Imágenes no soportadas tras cleanup.
 */
export async function extractTextFromDocument(file: File): Promise<string> {
    const fileType = file.type
    const buffer = await file.arrayBuffer()

    // Procesar PDF únicamente
    if (fileType === 'application/pdf') {
        try {
            // Dynamic import to prevent client-side bundling issues
            const pdf = (await import('pdf-parse')).default

            // pdf-parse acepta Buffer, aseguramos conversión
            const nodeBuffer = Buffer.from(buffer)
            const data = await pdf(nodeBuffer)

            return data.text.trim()
        } catch (error) {
            console.error("Error parsing PDF:", error)
            throw new Error("No se pudo leer el PDF. Asegúrate de que no esté protegido con contraseña.")
        }
    }

    // Imágenes no soportadas (tesseract.js removido en cleanup)
    if (fileType.startsWith('image/')) {
        throw new Error("El análisis de imágenes ya no está disponible. Por favor, usa archivos PDF.")
    }

    throw new Error(`Tipo de archivo no soportado: ${fileType}`)
}
