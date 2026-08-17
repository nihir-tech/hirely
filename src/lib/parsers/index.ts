import { extractTextFromPdf, renderPdfPreview } from './pdf'
import { ocrImage } from './image'
import { validateTextLength } from '../validation'
import type { FileParseResult } from './types'

export async function extractResumeText(
  file: File,
  onProgress?: (message: string, progress: number) => void,
): Promise<FileParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf' || file.type === 'application/pdf') {
    onProgress?.('Reading PDF document...', 20)
    const { text, pageCount } = await extractTextFromPdf(file)

    const validation = validateTextLength(text)
    if (validation) {
      return { text: '', pageCount, error: validation.message, preview: undefined }
    }

    onProgress?.('Generating preview...', 80)
    let preview: string | undefined
    try {
      preview = await renderPdfPreview(file)
    } catch {
      // Preview is optional
    }

    return { text, pageCount, preview }
  }

  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(ext)) {
    onProgress?.('Preparing image for OCR...', 10)
    const preview = URL.createObjectURL(file)

    onProgress?.('Running text recognition (OCR)...', 20)
    const text = await ocrImage(file, (pct) => {
      const progress = 20 + Math.round((pct / 100) * 70)
      onProgress?.('Running text recognition (OCR)...', progress)
    })

    const validation = validateTextLength(text)
    if (validation) {
      return { text: '', pageCount: 1, error: validation.message, preview }
    }

    return { text, pageCount: 1, preview }
  }

  return {
    text: '',
    pageCount: 0,
    error: `Unsupported file type: ${ext || file.type || 'unknown'}. Please upload a PDF, PNG, JPG, or WebP file.`,
  }
}
