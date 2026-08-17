import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

interface FlatItem {
  str: string
  y: number
  x: number
  width: number
}

let workerInitialized = false

async function initWorker(): Promise<void> {
  if (workerInitialized) return
  try {
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  }
  workerInitialized = true
}

function groupItemsIntoLines(items: TextItem[]): string[][] {
  const sorted = items
    .filter(i => 'str' in i && i.str.trim())
    .map<FlatItem>(i => ({
      str: i.str,
      y: Math.round(i.transform[5]),
      x: i.transform[4],
      width: i.width,
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: FlatItem[][] = []
  let currentLine: FlatItem[] = []
  let lastY: number | null = null

  for (const item of sorted) {
    if (lastY !== null && Math.abs(item.y - lastY) > 4) {
      lines.push(currentLine)
      currentLine = []
    }
    currentLine.push(item)
    lastY = item.y
  }
  if (currentLine.length) lines.push(currentLine)

  return lines.map(line => {
    const result: string[] = []
    let prevEnd = 0
    for (const item of line) {
      const gap = item.x - prevEnd
      if (result.length > 0 && gap > item.width * 0.3) {
        result.push('  ')
      } else if (result.length > 0 && gap > 2) {
        result.push(' ')
      }
      result.push(item.str)
      prevEnd = item.x + item.width
    }
    return result
  })
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  await initWorker()

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pageTexts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const lines = groupItemsIntoLines(content.items as TextItem[])
    const pageText = lines.map(parts => parts.join('')).join('\n')
    pageTexts.push(pageText)
  }

  const text = pageTexts.join('\n\n')
  return { text, pageCount: pdf.numPages }
}

export async function renderPdfPreview(
  file: File,
  maxWidth = 600,
): Promise<string> {
  await initWorker()

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / viewport.width
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise

  return canvas.toDataURL('image/jpeg', 0.8)
}
