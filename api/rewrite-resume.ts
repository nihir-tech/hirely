import { chatJson } from './_lib/ai.js'
import { REWRITE_SYSTEM_PROMPT } from './_lib/prompts.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { resumeText, focus, jobDescription, company, jobTitle } = req.body || {}

    if (!resumeText) {
      return res.status(400).json({ error: 'resumeText is required.' })
    }

    let context = ''
    if (jobDescription) context += `\n\nTarget Job Description:\n${jobDescription}`
    if (company) context += `\nTarget Company: ${company}`
    if (jobTitle) context += `\nTarget Title: ${jobTitle}`

    const truncated = resumeText.length > 30000 ? resumeText.slice(0, 30000) + '\n\n[Truncated]' : resumeText
    const result = await chatJson({
      system: REWRITE_SYSTEM_PROMPT,
      user: `Rewrite this resume (${focus || 'general'} focus):\n\n${truncated}${context}`,
      maxTokens: 4000,
    })

    return res.status(200).json({ rewritten: result })
  } catch (err) {
    console.error('[rewrite-resume]', err)
    const message = err instanceof Error ? err.message : 'Rewrite failed'
    return res.status(500).json({ error: message, code: 'REWRITE_FAILED' })
  }
}
