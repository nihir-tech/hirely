/**
 * Self-contained ATS-Friendly PDF Resume Generator
 * Generates standards-compliant PDF 1.4 documents with clean typography,
 * high-contrast formatting, and instant direct browser download.
 */

export interface ResumePdfData {
  title?: string
  name?: string
  contact?: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  summary?: string
  sections: Array<{
    heading: string
    items: Array<{
      title?: string
      subtitle?: string
      dateRange?: string
      bullets?: string[]
      text?: string
    }>
  }>
}

/**
 * Escapes characters for PDF literal strings: ( -> \(, ) -> \), \ -> \\
 */
function escapePdfText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // replace non-ASCII characters with clean ASCII equivalents
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u2023]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
}

/**
 * Parses markdown resume text into structured sections
 */
export function parseMarkdownToResumeData(markdown: string, defaultName = 'Your Name'): ResumePdfData {
  const lines = markdown.split(/\r?\n/)
  const result: ResumePdfData = {
    name: defaultName,
    sections: [],
  }

  let currentHeading = ''
  let currentBullets: string[] = []
  let currentTitle = ''
  let currentSubtitle = ''
  let currentDate = ''
  let currentParagraph = ''

  function flushItem() {
    if (!currentHeading && (currentParagraph || currentTitle || currentBullets.length)) {
      if (!result.summary && currentParagraph) {
        result.summary = currentParagraph.trim()
      }
      currentParagraph = ''
      currentBullets = []
      currentTitle = ''
      return
    }

    if (currentHeading && (currentTitle || currentBullets.length || currentParagraph)) {
      let section = result.sections.find((s) => s.heading.toLowerCase() === currentHeading.toLowerCase())
      if (!section) {
        section = { heading: currentHeading, items: [] }
        result.sections.push(section)
      }
      section.items.push({
        title: currentTitle || undefined,
        subtitle: currentSubtitle || undefined,
        dateRange: currentDate || undefined,
        bullets: currentBullets.length ? [...currentBullets] : undefined,
        text: currentParagraph ? currentParagraph.trim() : undefined,
      })
      currentTitle = ''
      currentSubtitle = ''
      currentDate = ''
      currentBullets = []
      currentParagraph = ''
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) {
      if (currentParagraph) {
        currentParagraph += ' '
      }
      continue
    }

    // Name (top # header)
    if (raw.startsWith('# ') && !result.name && i < 5) {
      result.name = raw.replace(/^#\s+/, '').trim()
      continue
    } else if (raw.startsWith('# ') && result.name === defaultName && i < 5) {
      result.name = raw.replace(/^#\s+/, '').trim()
      continue
    }

    // Section headings (## or ###)
    if (raw.startsWith('## ') || (raw.startsWith('### ') && !currentHeading)) {
      flushItem()
      currentHeading = raw.replace(/^#{2,3}\s+/, '').replace(/[*_#]/g, '').trim()
      continue
    }

    // Sub-item heading (### in an existing section)
    if (raw.startsWith('### ')) {
      flushItem()
      const titleText = raw.replace(/^###\s+/, '').replace(/[*_#]/g, '').trim()
      // Check if it has date (e.g. "Software Engineer | 2022 - Present")
      if (titleText.includes('|')) {
        const parts = titleText.split('|').map((p) => p.trim())
        currentTitle = parts[0]
        currentDate = parts[1] || ''
      } else {
        currentTitle = titleText
      }
      continue
    }

    // Bullet points
    if (/^[-*•]\s+/.test(raw)) {
      const bullet = raw.replace(/^[-*•]\s+/, '').replace(/[*_]/g, '').trim()
      if (bullet) currentBullets.push(bullet)
      continue
    }

    // Contact line (e.g. "email@domain.com | +123456789 | San Francisco | linkedin.com/in/...")
    if (
      !result.contact &&
      i < 6 &&
      (raw.includes('@') || raw.includes('|') || /phone|linkedin|github/i.test(raw))
    ) {
      const parts = raw.split(/[|•·]/).map((p) => p.trim())
      const contactObj: NonNullable<ResumePdfData['contact']> = {}
      for (const p of parts) {
        if (p.includes('@')) contactObj.email = p
        else if (/\d{3,}/.test(p) && !p.includes('http')) contactObj.phone = p
        else if (/linkedin/i.test(p)) contactObj.linkedin = p
        else if (/github/i.test(p)) contactObj.github = p
        else if (!contactObj.location && !p.includes('.')) contactObj.location = p
      }
      result.contact = contactObj
      continue
    }

    // Regular text / paragraph
    const cleaned = raw.replace(/[*_]/g, '')
    if (cleaned) {
      if (currentParagraph) currentParagraph += ' ' + cleaned
      else currentParagraph = cleaned
    }
  }

  flushItem()
  return result
}

/**
 * Builds and downloads a crisp, ATS-compliant PDF document directly to the user's browser.
 */
export function generatePdfResume(
  markdownOrData: string | ResumePdfData,
  fileName = 'Resume.pdf',
  fallbackName = 'Candidate',
) {
  const data: ResumePdfData =
    typeof markdownOrData === 'string'
      ? parseMarkdownToResumeData(markdownOrData, fallbackName)
      : markdownOrData

  const name = data.name || fallbackName
  const contactParts: string[] = []
  if (data.contact?.email) contactParts.push(data.contact.email)
  if (data.contact?.phone) contactParts.push(data.contact.phone)
  if (data.contact?.location) contactParts.push(data.contact.location)
  if (data.contact?.linkedin) contactParts.push(data.contact.linkedin)
  if (data.contact?.github) contactParts.push(data.contact.github)
  if (data.contact?.website) contactParts.push(data.contact.website)

  // Page geometry (A4 in points: 595.28 x 841.89)
  const pageWidth = 595
  const pageHeight = 842
  const marginLeft = 48
  const marginRight = 48
  const printableWidth = pageWidth - marginLeft - marginRight
  const topMargin = 50
  const bottomMargin = 50

  const pages: string[][] = [[]]
  let currentPageIndex = 0
  let y = pageHeight - topMargin

  function ensureSpace(requiredPt: number) {
    if (y - requiredPt < bottomMargin) {
      pages.push([])
      currentPageIndex++
      y = pageHeight - topMargin
    }
  }

  function addOp(op: string) {
    pages[currentPageIndex].push(op)
  }

  // Draw Header
  addOp(`BT /F2 20 Tf 0 0 0 rg ${marginLeft} ${y} Td (${escapePdfText(name)}) Tj ET`)
  y -= 22

  if (contactParts.length) {
    const contactLine = contactParts.join('  |  ')
    addOp(`BT /F1 9 Tf 0.3 0.3 0.3 rg ${marginLeft} ${y} Td (${escapePdfText(contactLine)}) Tj ET`)
    y -= 14
  }

  // Header separator line
  addOp(`0.8 0.8 0.8 RG 1 w ${marginLeft} ${y} m ${pageWidth - marginRight} ${y} l S`)
  y -= 18

  // Summary
  if (data.summary) {
    ensureSpace(40)
    addOp(`BT /F2 11 Tf 0.1 0.3 0.6 rg ${marginLeft} ${y} Td (PROFESSIONAL SUMMARY) Tj ET`)
    y -= 14

    const words = data.summary.split(/\s+/)
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).length > 90) {
        ensureSpace(12)
        addOp(`BT /F1 9.5 Tf 0.15 0.15 0.15 rg ${marginLeft} ${y} Td (${escapePdfText(line)}) Tj ET`)
        y -= 12
        line = w
      } else {
        line = line ? line + ' ' + w : w
      }
    }
    if (line) {
      ensureSpace(12)
      addOp(`BT /F1 9.5 Tf 0.15 0.15 0.15 rg ${marginLeft} ${y} Td (${escapePdfText(line)}) Tj ET`)
      y -= 16
    }
  }

  // Sections
  for (const section of data.sections) {
    ensureSpace(45)
    // Section header
    const heading = section.heading.toUpperCase()
    addOp(`BT /F2 11 Tf 0.1 0.3 0.6 rg ${marginLeft} ${y} Td (${escapePdfText(heading)}) Tj ET`)
    y -= 4
    addOp(`0.85 0.85 0.85 RG 0.75 w ${marginLeft} ${y} m ${pageWidth - marginRight} ${y} l S`)
    y -= 14

    for (const item of section.items) {
      if (item.title || item.subtitle || item.dateRange) {
        ensureSpace(20)
        let titleLine = item.title || ''
        if (item.subtitle) titleLine += (titleLine ? '  -  ' : '') + item.subtitle
        addOp(`BT /F2 10 Tf 0.1 0.1 0.1 rg ${marginLeft} ${y} Td (${escapePdfText(titleLine)}) Tj ET`)

        if (item.dateRange) {
          const dateStr = escapePdfText(item.dateRange)
          // right-align date approx
          const approxX = pageWidth - marginRight - dateStr.length * 5.2
          addOp(`BT /F3 9 Tf 0.4 0.4 0.4 rg ${Math.max(approxX, marginLeft + 200)} ${y} Td (${dateStr}) Tj ET`)
        }
        y -= 13
      }

      if (item.text) {
        const words = item.text.split(/\s+/)
        let line = ''
        for (const w of words) {
          if ((line + ' ' + w).length > 90) {
            ensureSpace(12)
            addOp(`BT /F1 9 Tf 0.2 0.2 0.2 rg ${marginLeft} ${y} Td (${escapePdfText(line)}) Tj ET`)
            y -= 12
            line = w
          } else {
            line = line ? line + ' ' + w : w
          }
        }
        if (line) {
          ensureSpace(12)
          addOp(`BT /F1 9 Tf 0.2 0.2 0.2 rg ${marginLeft} ${y} Td (${escapePdfText(line)}) Tj ET`)
          y -= 12
        }
      }

      if (item.bullets && item.bullets.length) {
        for (const bullet of item.bullets) {
          ensureSpace(16)
          const words = bullet.split(/\s+/)
          let first = true
          let line = ''
          for (const w of words) {
            if ((line + ' ' + w).length > 85) {
              ensureSpace(12)
              const xPos = first ? marginLeft + 8 : marginLeft + 16
              const prefix = first ? '•  ' : ''
              addOp(`BT /F1 9 Tf 0.2 0.2 0.2 rg ${xPos} ${y} Td (${escapePdfText(prefix + line)}) Tj ET`)
              y -= 12
              line = w
              first = false
            } else {
              line = line ? line + ' ' + w : w
            }
          }
          if (line) {
            ensureSpace(12)
            const xPos = first ? marginLeft + 8 : marginLeft + 16
            const prefix = first ? '•  ' : ''
            addOp(`BT /F1 9 Tf 0.2 0.2 0.2 rg ${xPos} ${y} Td (${escapePdfText(prefix + line)}) Tj ET`)
            y -= 13
          }
        }
      }

      y -= 4
    }

    y -= 8
  }

  // Assemble PDF Objects
  const numPages = pages.length
  const objects: string[] = []

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj')

  // Object 2: Pages
  const pageObjectIds: number[] = []
  for (let i = 0; i < numPages; i++) {
    pageObjectIds.push(3 + i * 2)
  }
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${numPages} >>\nendobj`,
  )

  // Fonts Objects: F1 (Helvetica), F2 (Helvetica-Bold), F3 (Helvetica-Oblique)
  const fontObjStart = 3 + numPages * 2
  const f1Id = fontObjStart
  const f2Id = fontObjStart + 1
  const f3Id = fontObjStart + 2

  // Create page and stream objects
  for (let i = 0; i < numPages; i++) {
    const pageId = 3 + i * 2
    const streamId = 4 + i * 2
    const streamContent = pages[i].join('\n')
    const streamLen = streamContent.length

    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R >> >> >>\nendobj`,
    )
    objects.push(`${streamId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`)
  }

  // Add Font objects
  objects.push(`${f1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`)
  objects.push(`${f2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`)
  objects.push(`${f3Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj`)

  // Construct PDF File with XRef
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets: number[] = []

  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj + '\n'
  }

  const xrefOffset = pdf.length
  pdf += 'xref\n'
  pdf += `0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`
  }

  pdf += 'trailer\n'
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += 'startxref\n'
  pdf += `${xrefOffset}\n`
  pdf += '%%EOF'

  // Trigger Instant Download
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Opens a print-formatted view in a clean popup window ready for browser "Save as PDF" or Print.
 */
export function printResumePreview(markdownOrData: string | ResumePdfData, title = 'Resume') {
  const data: ResumePdfData =
    typeof markdownOrData === 'string'
      ? parseMarkdownToResumeData(markdownOrData, title)
      : markdownOrData

  const win = window.open('', '_blank', 'width=850,height=1000')
  if (!win) {
    alert('Please allow popups to preview/print your resume.')
    return
  }

  const contactItems: string[] = []
  if (data.contact?.email) contactItems.push(data.contact.email)
  if (data.contact?.phone) contactItems.push(data.contact.phone)
  if (data.contact?.location) contactItems.push(data.contact.location)
  if (data.contact?.linkedin) contactItems.push(`<a href="${data.contact.linkedin}">${data.contact.linkedin}</a>`)
  if (data.contact?.github) contactItems.push(`<a href="${data.contact.github}">${data.contact.github}</a>`)

  let sectionsHtml = ''
  for (const sec of data.sections) {
    let itemsHtml = ''
    for (const it of sec.items) {
      let bulletsHtml = ''
      if (it.bullets?.length) {
        bulletsHtml = `<ul>${it.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`
      }
      itemsHtml += `
        <div class="item">
          <div class="item-head">
            <span class="item-title">${it.title || ''}${it.subtitle ? ` <span class="item-sub">— ${it.subtitle}</span>` : ''}</span>
            <span class="item-date">${it.dateRange || ''}</span>
          </div>
          ${it.text ? `<p class="item-desc">${it.text}</p>` : ''}
          ${bulletsHtml}
        </div>
      `
    }
    sectionsHtml += `
      <section>
        <h2>${sec.heading}</h2>
        ${itemsHtml}
      </section>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.name || title} - Resume</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 10.5pt;
            line-height: 1.45;
          }
          h1 { margin: 0 0 4px 0; font-size: 22pt; font-weight: 700; color: #0f172a; }
          .contact { font-size: 9pt; color: #4b5563; margin-bottom: 14px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 8px; }
          .contact a { color: #2563eb; text-decoration: none; }
          h2 {
            font-size: 11pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1e3a8a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin: 14px 0 8px 0;
          }
          .item { margin-bottom: 10px; }
          .item-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 10pt; font-weight: 600; color: #111827; }
          .item-sub { font-weight: 400; color: #4b5563; }
          .item-date { font-size: 8.5pt; color: #64748b; font-weight: 500; }
          .item-desc { margin: 3px 0; font-size: 9.5pt; color: #334155; }
          ul { margin: 4px 0 6px 18px; padding: 0; }
          li { margin-bottom: 3px; font-size: 9.5pt; color: #334155; }
          .summary { font-size: 9.5pt; color: #334155; margin-bottom: 12px; }
          .print-bar {
            position: sticky; top: 0; background: #0f172a; color: white; padding: 10px 16px;
            display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px;
          }
          .print-btn {
            background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;
          }
          @media print {
            .print-bar { display: none !important; }
            body { padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <span>Hirely Resume Print View</span>
          <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
        </div>
        <h1>${data.name || title}</h1>
        <div class="contact">${contactItems.join(' &nbsp;•&nbsp; ')}</div>
        ${data.summary ? `<div class="summary">${data.summary}</div>` : ''}
        ${sectionsHtml}
      </body>
    </html>
  `

  win.document.write(html)
  win.document.close()
}
