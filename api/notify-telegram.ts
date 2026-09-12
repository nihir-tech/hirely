import type { VercelRequest, VercelResponse } from '@vercel/node'
import Busboy from 'busboy'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

// Keep under Vercel hobby plan's 4.5 MB request body limit
const MAX_FILE = 4_000_000

function buildCaption(fields: Record<string, string>): string {
  const lines: string[] = []
  if (fields.displayName) lines.push(`👤 ${fields.displayName}`)
  if (fields.email) lines.push(`📧 ${fields.email}`)
  lines.push(`📄 ${fields.fileName ?? 'resume'}`)
  if (fields.score) lines.push(`🏆 Score: ${fields.score}`)
  if (fields.jobCompany) lines.push(`🎯 Target: ${fields.jobCompany}${fields.jobTitle ? ` — ${fields.jobTitle}` : ''}`)
  if (fields.ts) lines.push(`🕒 ${new Date(fields.ts).toLocaleString()}`)
  return lines.join('\n').slice(0, 1000)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(503).json({ error: 'Telegram bot is not configured.' })
  }

  try {
    const fields: Record<string, string> = {}

    const uploaded = await new Promise<{ buffer: Buffer; name: string; mime: string }>((resolvePromise, rejectPromise) => {
      const bb = Busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: MAX_FILE + 512 * 1024 },
      })

      let buffer: Buffer | null = null
      let name = ''
      let mime = 'application/octet-stream'

      bb.on('file', (_name, stream, info) => {
        name = info.filename || 'resume'
        mime = info.mimeType || mime
        const chunks: Buffer[] = []
        stream.on('data', (c) => chunks.push(c as Buffer))
        stream.on('end', () => {
          buffer = Buffer.concat(chunks)
        })
      })

      bb.on('field', (name, val) => {
        fields[name] = val
      })

      bb.on('close', () => {
        if (buffer && name) return resolvePromise({ buffer, name, mime })
        rejectPromise(new Error('No file received.'))
      })
      bb.on('error', rejectPromise)
      req.pipe(bb)
    })

    const fileBuffer = uploaded.buffer
    const fileName = uploaded.name
    const mimeType = uploaded.mime

    const caption = buildCaption(fields)
    const tgUrl =
      fileBuffer.length <= MAX_FILE
        ? `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`
        : `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

    let body: FormData | URLSearchParams
    if (fileBuffer.length <= MAX_FILE) {
      const fd = new FormData()
      fd.append('chat_id', CHAT_ID)
      fd.append('document', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName)
      fd.append('caption', caption)
      body = fd
    } else {
      body = new URLSearchParams({
        chat_id: CHAT_ID,
        text: caption + '\n\n⚠️ File too large to relay automatically.',
      })
    }

    const tg = await fetch(tgUrl, { method: 'POST', body })
    const tgJson: { ok?: boolean; description?: string } = await tg.json().catch(() => ({}))

    if (!tg.ok || !tgJson.ok) {
      return res.status(502).json({ error: `Telegram API: ${tgJson.description ?? tg.statusText}` })
    }

    return res.status(200).json({ ok: true, sent: fileBuffer.length <= MAX_FILE ? 'file' : 'message' })
  } catch (err) {
    console.error('[notify-telegram]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to notify' })
  }
}