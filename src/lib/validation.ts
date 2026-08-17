import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../config'

export interface ValidationError {
  message: string
  code: string
}

export function validateFile(file: File): ValidationError | null {
  if (file.size === 0) {
    return { message: 'This file is empty. Please select a valid resume file.', code: 'EMPTY_FILE' }
  }

  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      message: `This file is ${mb} MB, which exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit. Please use a smaller file.`,
      code: 'FILE_TOO_LARGE',
    }
  }

  if (!ALLOWED_FILE_TYPES[file.type]) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'unknown'
    return {
      message: `The file type "${ext}" is not supported. Please upload a PDF, PNG, JPG, or WebP file.`,
      code: 'INVALID_TYPE',
    }
  }

  return null
}

export function validateTextLength(text: string): ValidationError | null {
  if (text.trim().length < 50) {
    return {
      message: 'The extracted text is too short to analyze. This may be a scanned image with poor quality or an empty document.',
      code: 'TEXT_TOO_SHORT',
    }
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)
}
