import { chatJson } from './_lib/ai.js'
import { ANALYZE_SYSTEM_PROMPT } from './_lib/prompts.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_TEXT = 50000
const MIN_TEXT = 50

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''

    if (text.length < MIN_TEXT) {
      return res.status(400).json({ error: 'Resume text is too short to analyze.', code: 'TEXT_TOO_SHORT' })
    }

    const truncated = text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '\n\n[Truncated]' : text
    const result = await chatJson({ system: ANALYZE_SYSTEM_PROMPT, user: `Analyze this resume:\n\n${truncated}` })

    return res.status(200).json({ analysis: result })
  } catch (err) {
    console.error('[analyze-resume]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return res.status(500).json({ error: message, code: 'ANALYSIS_FAILED' })
  }
}
