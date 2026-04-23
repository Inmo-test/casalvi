import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

/**
 * Extract text content from a PDF file URL
 * Uses pdf.js library for text extraction
 * 
 * @param fileUrl - URL of the PDF file (can be Supabase storage URL)
 * @returns Extracted text content from all pages
 */
export async function extractTextFromPDF(fileUrl: string): Promise<string> {
  try {
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    console.log(`[OCR] Loading PDF from: ${fileUrl}`)

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument(fileUrl)
    const pdf = await loadingTask.promise

    console.log(`[OCR] PDF loaded, ${pdf.numPages} pages found`)

    let fullText = ''

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
      
      console.log(`[OCR] Page ${i}/${pdf.numPages} extracted: ${pageText.length} characters`)
    }

    const trimmedText = fullText.trim()
    console.log(`[OCR] Total extracted: ${trimmedText.length} characters`)

    return trimmedText

  } catch (error) {
    console.error('[OCR] Error extracting text from PDF:', error)
    
    if (error instanceof Error) {
      throw new Error(`OCR failed: ${error.message}`)
    }
    throw new Error('OCR failed: Unknown error')
  }
}
